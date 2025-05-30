from pydantic import BaseModel
from executor import compile_c_code, execute_binary, execute_chester_code
from config import MAX_ITERATIONS
from langchain.prompts import PromptTemplate
from translator_agent import get_relevant_examples
from llms import get_llms
from langchain.output_parsers import PydanticOutputParser
import threading
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
import re


def compute_exact_match(pred: str, ref: str) -> float:
    return float(pred.strip() == ref.strip())


def compute_bleu(pred: str, ref: str) -> float:
    smoothie = SmoothingFunction().method4
    pred_tokens = pred.strip().split()
    ref_tokens = [ref.strip().split()]
    return sentence_bleu(ref_tokens, pred_tokens, smoothing_function=smoothie)


def compute_hallucination_index(pred: str, ref: str) -> float:
    # Simple heuristic: count lines in pred not present in ref
    pred_lines = set([l.strip() for l in pred.strip().splitlines() if l.strip()])
    ref_lines = set([l.strip() for l in ref.strip().splitlines() if l.strip()])
    hallucinated = pred_lines - ref_lines
    if not pred_lines:
        return 0.0
    return len(hallucinated) / len(pred_lines)


class ChesterOutput(BaseModel):
    code: str


def llm_benchmark_worker(
    llm_name, llm, c_code, reference_output, max_iterations, results
):
    parser = PydanticOutputParser(pydantic_object=ChesterOutput)
    feedback_history = []
    best_attempt = None
    success = False
    best_metrics = {
        "exact_match": 0.0,
        "bleu": 0.0,
        "hallucination": 1.0,
        "output": "",
    }
    for iteration in range(1, max_iterations + 1):
        print(f"\n--- {llm_name} Iteration {iteration}/{max_iterations} ---")
        relevant_docs = get_relevant_examples(c_code)
        chester_grammar = ""
        c_grammar = ""
        parallel_examples = ""
        for doc in relevant_docs:
            content = doc.page_content.lower()
            if "chester" in content and "grammar" in content:
                chester_grammar += doc.page_content + "\n\n"
            elif "grammar" in content and ("c " in content or "c\n" in content):
                c_grammar += doc.page_content + "\n\n"
            elif "parallel" in content or ("c:" in content and "chester:" in content):
                parallel_examples += doc.page_content + "\n\n"
        feedback_context = "\n".join(feedback_history[-3:])
        prompt = PromptTemplate(
            input_variables=[
                "chester_grammar",
                "c_grammar",
                "parallel_examples",
                "c_code",
                "feedback_context",
            ],
            template="""
                You are a code translator that converts C code to Chester programming language.
                Previous translation attempts and their results:
                {feedback_context}

                CHESTER LANGUAGE GRAMMAR:
                {chester_grammar}

                C LANGUAGE REFERENCE:
                {c_grammar}

                TRANSLATION EXAMPLES (C to Chester):
                {parallel_examples}

                TASK: Translate this C code to Chester:
                {c_code}

                INSTRUCTIONS:
                1. Analyze any previous errors shown in feedback context
                2. Ensure Chester syntax follows the grammar exactly
                3. Match the reference output: {reference_output}
                4. Fix any type mismatches or function signature issues
                5. Handle recursion and variable scoping properly
                6. Do not use any C-specific libraries or functions (such as main function, include statements, etc.)
                7. For any C functions, use Chester equivalents or implement them in Chester via polyfills or custom functions

                Output ONLY the corrected Chester code:
            """,
            partial_variables={
                "format_instructions": parser.get_format_instructions(),
                "reference_output": reference_output,
            },
        )
        chain = prompt | llm.with_structured_output(ChesterOutput)
        try:
            result = chain.invoke(
                {
                    "chester_grammar": chester_grammar,
                    "c_grammar": c_grammar,
                    "parallel_examples": parallel_examples,
                    "c_code": c_code,
                    "feedback_context": feedback_context,
                }
            )
        except Exception as e:
            print(f"Error during LLM invocation")
            continue
        chester_code = result.code
        print(f"Generated Chester code:\n{chester_code}")
        try:
            chester_output = execute_chester_code(chester_code)
            print(f"Chester output: {chester_output}")
            exact = compute_exact_match(chester_output, reference_output)
            bleu = compute_bleu(chester_output, reference_output)
            halluc = compute_hallucination_index(chester_output, reference_output)
            if bleu > best_metrics["bleu"]:
                best_metrics["bleu"] = bleu
            if exact > best_metrics["exact_match"]:
                best_metrics["exact_match"] = exact
            if halluc < best_metrics["hallucination"]:
                best_metrics["hallucination"] = halluc
            best_metrics["output"] = chester_output
            if chester_output == reference_output:
                results.append((llm_name, iteration, True, exact, bleu, halluc))
                success = True
                break
            feedback = (
                f"Attempt {iteration}:\n"
                f"Generated code:\n{chester_code}\n"
                f"Output: {chester_output}\n"
                f"Expected: {reference_output}\n"
                f"Issue: Output mismatch"
            )
            feedback_history.append(feedback)
            if not best_attempt or len(chester_output) > len(best_attempt[1]):
                best_attempt = (chester_code, chester_output)
        except Exception as e:
            print(f"🚨 Execution error: {str(e)}")
            feedback = (
                f"Attempt {iteration}:\n"
                f"Generated code:\n{chester_code}\n"
                f"Error: {str(e)}"
            )
            feedback_history.append(feedback)
    if not success:
        print(f"❌ {llm_name} did not succeed in {max_iterations} iterations.")
        if best_attempt:
            print(f"Best attempt output: {best_attempt[1]}")
        results.append(
            (
                llm_name,
                max_iterations,
                False,
                best_metrics["exact_match"],
                best_metrics["bleu"],
                best_metrics["hallucination"],
            )
        )


def benchmark_llms_on_translation(c_code: str, max_iterations: int = MAX_ITERATIONS):
    try:
        c_exec = compile_c_code(c_code)
        reference_output = execute_binary(c_exec)
        print(f"Reference C output: {reference_output}")
    except Exception as e:
        print(f"C execution failed: {e}")
        return

    llms = get_llms()
    results = []
    threads = []

    for llm_name, llm in llms:
        t = threading.Thread(
            target=llm_benchmark_worker,
            args=(llm_name, llm, c_code, reference_output, max_iterations, results),
        )
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

    print("\n=== Benchmark Results ===")
    print(
        f"{'LLM':<20} | {'Iterations':<10} | {'Success':<7} | {'ExactMatch':<10} | {'BLEU':<8} | {'Halluc.':<9}"
    )
    print("-" * 80)
    for llm_name, iterations, success, exact, bleu, halluc in results:
        print(
            f"{llm_name:<20} | {iterations:<10} | {str(success):<7} | {exact:<10.2f} | {bleu:<8.2f} | {halluc:<9.2f}"
        )
    print("\n")
