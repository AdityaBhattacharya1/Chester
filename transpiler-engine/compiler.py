from pydantic import BaseModel
from executor import compile_c_code, execute_binary, execute_chester_code
from config import MAX_ITERATIONS
from langchain.prompts import PromptTemplate
from translator_agent import get_relevant_examples, llm
from langchain.output_parsers import PydanticOutputParser


class ChesterOutput(BaseModel):
    code: str


def translate_c_to_chester(c_code: str, max_iterations: int = MAX_ITERATIONS) -> str:
    # Compile and get reference output from C code
    try:
        c_exec = compile_c_code(c_code)
        reference_output = execute_binary(c_exec)
        print(f"Reference C output: {reference_output}")
    except Exception as e:
        print(f"C execution failed: {e}")
        return ""

    parser = PydanticOutputParser(pydantic_object=ChesterOutput)
    feedback_history = []
    best_attempt = None

    for iteration in range(1, max_iterations + 1):
        print(f"\n=== Iteration {iteration}/{max_iterations} ===")

        # Get relevant examples and documentation
        relevant_docs = get_relevant_examples(c_code)

        # Build knowledge components
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

        # Build prompt with feedback history
        feedback_context = "\n".join(feedback_history[-3:])  # Keep last 3 attempts
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

        # Generate Chester code
        chain = prompt | llm.with_structured_output(ChesterOutput)
        result = chain.invoke(
            {
                "chester_grammar": chester_grammar,
                "c_grammar": c_grammar,
                "parallel_examples": parallel_examples,
                "c_code": c_code,
                "feedback_context": feedback_context,
            }
        )

        chester_code = result.code
        print(f"Generated Chester code:\n{chester_code}")

        # Execute and compare outputs
        try:
            chester_output = execute_chester_code(chester_code)
            print(f"Chester output: {chester_output}")

            if chester_output == reference_output:
                print("✅ Success! Outputs match!")
                return chester_code

            # Store feedback for next iteration
            feedback = (
                f"Attempt {iteration}:\n"
                f"Generated code:\n{chester_code}\n"
                f"Output: {chester_output}\n"
                f"Expected: {reference_output}\n"
                f"Issue: Output mismatch"
            )
            feedback_history.append(feedback)

            # Track best attempt (closest match)
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

    # After all iterations
    if best_attempt:
        print("\n⚠️ Best attempt results:")
        print(f"Code:\n{best_attempt[0]}")
        print(f"Output: {best_attempt[1]}")
        print(f"Expected: {reference_output}")

    return best_attempt[0] if best_attempt else ""


translate_c_to_chester(
    """
        #include <stdio.h>

        int main() {
            printf("Hello, Chester!\\n");
            int a = 5;
            int b = 10;
            int sum = a + b;
            printf("%d\\n", sum);
            return 0;
        }
    """
)
