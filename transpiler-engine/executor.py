import subprocess
import tempfile
import os
from config import C_EXECUTABLE_PATH, CHESTER_EXECUTABLE


def compile_c_code(c_code: str) -> str:
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".c", delete=False
    ) as temp_c_file:
        temp_c_file.write(c_code)
        temp_c_file_path = temp_c_file.name

    compile_process = subprocess.run(
        ["gcc", temp_c_file_path, "-o", C_EXECUTABLE_PATH],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    os.unlink(temp_c_file_path)  # Clean up temporary C file

    if compile_process.returncode != 0:
        raise RuntimeError(f"C compilation error: {compile_process.stderr}")

    return C_EXECUTABLE_PATH


def execute_binary(executable_path: str) -> str:
    execute_process = subprocess.run(
        [executable_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=5,
    )

    if execute_process.returncode != 0:
        raise RuntimeError(f"Execution error: {execute_process.stderr}")

    return execute_process.stdout.strip()


def execute_chester_code(chester_code: str) -> str:
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".ct", delete=False
    ) as temp_chester_file:
        temp_chester_file.write(chester_code)
        temp_chester_file_path = temp_chester_file.name

    execute_process = subprocess.run(
        [CHESTER_EXECUTABLE, temp_chester_file_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=5,
    )

    os.unlink(temp_chester_file_path)  # Clean up temporary Chester file

    if execute_process.returncode != 0:
        raise RuntimeError(f"Chester execution error: {execute_process.stderr}")

    return execute_process.stdout.strip()
