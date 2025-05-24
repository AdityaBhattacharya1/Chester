from pydantic import BaseModel
from executor import compile_c_code, execute_binary, execute_chester_code
from config import MAX_ITERATIONS
from langchain.prompts import PromptTemplate
from translator_agent import get_relevant_examples, llm
from langchain.output_parsers import PydanticOutputParser


class ChesterOutput(BaseModel):
    code: str


def translate_c_to_chester(c_code: str, max_iterations: int = MAX_ITERATIONS) -> str:
    try:
        c_exec = compile_c_code(c_code)
        reference_output = execute_binary(c_exec)
        print(f"Reference C output: {reference_output}")
    except Exception as e:
        print(f"C execution failed: {e}")
        reference_output = None

    parser = PydanticOutputParser(pydantic_object=ChesterOutput)

    for iteration in range(1, max_iterations + 1):
        print(f"\nIteration {iteration}")

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

        prompt = PromptTemplate(
            input_variables=[
                "chester_grammar",
                "c_grammar",
                "parallel_examples",
                "c_code",
            ],
            template="""
                You are a code translator that converts C code to Chester programming language.

                CHESTER LANGUAGE GRAMMAR AND SYNTAX:
                {chester_grammar}

                C LANGUAGE REFERENCE:
                {c_grammar}

                TRANSLATION EXAMPLES (C to Chester):
                {parallel_examples}

                IMPORTANT RULES:
                1. You MUST output Chester code, NOT C code
                2. Follow Chester syntax rules exactly as shown in the grammar
                3. Use Chester-specific keywords and syntax patterns
                4. Do not include C syntax like #include, printf, etc. unless Chester has equivalent constructs
                5. Convert C constructs to their Chester equivalents based on the examples

                C CODE TO TRANSLATE:
                {c_code}

                Output ONLY the Chester code translation:
                """,
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )

        chain = prompt | llm.with_structured_output(ChesterOutput)
        result = chain.invoke(
            {
                "chester_grammar": chester_grammar,
                "c_grammar": c_grammar,
                "parallel_examples": parallel_examples,
                "c_code": c_code,
            },
        )

        chester_code = result.code

        print(f"Generated Chester code:\n{chester_code}")

        if reference_output:
            try:
                chester_output = execute_chester_code(chester_code)
                print(f"Chester output: {chester_output}")

                if chester_output == reference_output:
                    print("SUCCESS: Outputs match!")
                    return chester_code
                else:
                    print(
                        f"Output mismatch. Expected: '{reference_output}', Got: '{chester_output}'"
                    )
            except Exception as e:
                print(f"Chester execution failed: {e}")
        else:
            return chester_code

    print("Failed to create working translation within iteration limit")
    return chester_code


translate_c_to_chester(
    """
    #include <stdio.h>

    int main() {
        int n = factorial(5);
        printf("Factorial of %d is %d\\n", n, factorial(n));
        return 0;
    }

    int factorial(int n) {
        if (n == 0) {
            return 1;
        } else {
            return n * factorial(n - 1);
        }
    }
    """
)
