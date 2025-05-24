import subprocess
import tempfile
import os
import shutil
from config import C_EXECUTABLE_PATH


def compile_c_code(c_code: str) -> str:
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".c", delete=False
    ) as temp_c_file:
        temp_c_file.write(c_code)
        temp_c_file_path = temp_c_file.name

    try:
        compile_process = subprocess.run(
            ["gcc", temp_c_file_path, "-o", C_EXECUTABLE_PATH],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        if compile_process.returncode != 0:
            raise RuntimeError(f"C compilation error: {compile_process.stderr}")

        return C_EXECUTABLE_PATH
    finally:
        if os.path.exists(temp_c_file_path):
            os.unlink(temp_c_file_path)


def execute_binary(executable_path: str) -> str:
    sandbox_dir = tempfile.mkdtemp()

    try:
        sandbox_executable = os.path.join(sandbox_dir, "program")
        shutil.copy2(executable_path, sandbox_executable)
        os.chmod(sandbox_executable, 0o755)

        execute_process = subprocess.run(
            [sandbox_executable],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5,
            cwd=sandbox_dir,
        )

        if execute_process.returncode != 0:
            raise RuntimeError(f"Execution error: {execute_process.stderr}")

        return execute_process.stdout.strip()
    finally:
        shutil.rmtree(sandbox_dir, ignore_errors=True)
        if os.path.exists(executable_path):
            os.unlink(executable_path)


def execute_chester_code(chester_code: str) -> str:
    sandbox_dir = tempfile.mkdtemp()
    script_dir = os.path.dirname(os.path.abspath(__file__))
    shell_ts_path = os.path.join(os.path.dirname(script_dir), "cli.ts")

    try:
        temp_chester_file_path = os.path.join(sandbox_dir, "temp.ct")
        with open(temp_chester_file_path, "w") as temp_chester_file:
            temp_chester_file.write(chester_code)

        process = subprocess.run(
            ["ts-node", shell_ts_path, temp_chester_file_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=30,
        )

        if process.returncode != 0:
            error_msg = process.stderr.strip() or "Unknown error occurred"
            raise RuntimeError(f"Chester execution error: {error_msg}")

        return process.stdout.strip()
    finally:
        shutil.rmtree(sandbox_dir, ignore_errors=True)
