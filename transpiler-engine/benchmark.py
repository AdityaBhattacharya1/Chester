from compiler import benchmark_llms_on_translation

if __name__ == "__main__":
    benchmark_llms_on_translation(
        """
        #include <stdio.h>

        int main() {
            printf(\"Hello, Chester!\\n\");
            int a = 5;
            int b = 10;
            int sum = a + b;
            printf(\"%d\\n\", sum);
            return 0;
        }
        """
    )
