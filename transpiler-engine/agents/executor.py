import subprocess
import tempfile
import os
import json
from typing import Dict, Any, Optional
import platform

def run_c_code(code: str, input_data: Optional[str] = None, compiler_flags: Optional[str] = None) -> Dict[str, Any]:
    """
    Compile and run C code in a sandbox environment
    
    Args:
        code: String containing C code
        input_data: Optional string to provide as stdin to the program
        compiler_flags: Optional compiler flags
        
    Returns:
        Dictionary containing stdout, stderr, compile_output, exit_code, and execution_time
    """
    result = {
        "stdout": "",
        "stderr": "",
        "compile_output": "",
        "exit_code": None,
        "execution_time": None,
        "success": False,
        "error": None
    }
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            c_file_path = os.path.join(temp_dir, "program.c")
            executable_path = os.path.join(temp_dir, "program.exe" if platform.system() == "Windows" else "program")
            
            with open(c_file_path, "w") as f:
                f.write(code)
            
            # Compile the code with safeguards
            flags = compiler_flags or "-Wall -Werror"
            compile_cmd = f"gcc {c_file_path} -o {executable_path} {flags}"
            
            compile_process = subprocess.run(
                compile_cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=10  # Timeout for compilation (seconds)
            )
            
            result["compile_output"] = compile_process.stdout + compile_process.stderr
            
            if compile_process.returncode != 0:
                result["error"] = "Compilation failed"
                result["exit_code"] = compile_process.returncode
                return result
            
            run_cmd = [executable_path]
            
            process = subprocess.Popen(
                run_cmd,
                stdin=subprocess.PIPE if input_data else None,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            try:
                stdout, stderr = process.communicate(
                    input=input_data,
                    timeout=5  # Timeout for execution (seconds)
                )
                
                result["stdout"] = stdout
                result["stderr"] = stderr
                result["exit_code"] = process.returncode
                result["success"] = process.returncode == 0
                
            except subprocess.TimeoutExpired:
                process.kill()
                result["error"] = "Execution timed out"
                stdout, stderr = process.communicate()
                result["stdout"] = stdout
                result["stderr"] = stderr
                
    except Exception as e:
        result["error"] = str(e)
        
    return result

def run(input_obj: Dict[str, Any]) -> Dict[str, Any]:
    """
    Agno agent entry point function
    
    Args:
        input_obj: Dictionary with 'code' and optional 'input' and 'compiler_flags' keys
        
    Returns:
        Dictionary with execution results
    """
    if not isinstance(input_obj, dict):
        return {"error": "Input must be a dictionary"}
    
    if "code" not in input_obj:
        return {"error": "Input must contain 'code' key"}
    
    code = input_obj.get("code", "")
    input_data = input_obj.get("input", "")
    compiler_flags = input_obj.get("compiler_flags", None)
    
    result = run_c_code(code, input_data, compiler_flags)
    
    return result