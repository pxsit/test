#!/usr/bin/env python3
"""
Debug script to test the test generation workflow without full backend
"""
import json
import subprocess
import sys
import os

def test_generator(generator_path, test_number):
    """Test running a generator file"""
    try:
        if generator_path.endswith('.py'):
            result = subprocess.run([
                'python3', generator_path, str(test_number)
            ], capture_output=True, text=True, timeout=10)
        elif generator_path.endswith('.cpp'):
            # Compile first
            exe_path = generator_path.replace('.cpp', '.exe')
            compile_result = subprocess.run([
                'g++', generator_path, '-o', exe_path, '-std=c++17'
            ], capture_output=True, text=True, timeout=30)
            
            if compile_result.returncode != 0:
                return False, f"Compilation failed: {compile_result.stderr}"
            
            result = subprocess.run([
                exe_path, str(test_number)
            ], capture_output=True, text=True, timeout=10)
        else:
            return False, "Unsupported file type"
        
        if result.returncode == 0:
            return True, result.stdout.strip()
        else:
            return False, f"Runtime error: {result.stderr}"
            
    except subprocess.TimeoutExpired:
        return False, "Generator timed out"
    except Exception as e:
        return False, f"Error: {str(e)}"

def test_solution(solution_path, input_data):
    """Test running a solution file with input"""
    try:
        if solution_path.endswith('.py'):
            result = subprocess.run([
                'python3', solution_path
            ], input=input_data, capture_output=True, text=True, timeout=10)
        elif solution_path.endswith('.cpp'):
            # Compile first
            exe_path = solution_path.replace('.cpp', '.exe')
            compile_result = subprocess.run([
                'g++', solution_path, '-o', exe_path, '-std=c++17'
            ], capture_output=True, text=True, timeout=30)
            
            if compile_result.returncode != 0:
                return False, f"Compilation failed: {compile_result.stderr}"
            
            result = subprocess.run([
                exe_path
            ], input=input_data, capture_output=True, text=True, timeout=10)
        else:
            return False, "Unsupported file type"
        
        if result.returncode == 0:
            return True, result.stdout.strip()
        else:
            return False, f"Runtime error: {result.stderr}"
            
    except subprocess.TimeoutExpired:
        return False, "Solution timed out"
    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    if len(sys.argv) != 3:
        print("Usage: python debug_test_generation.py <generator_file> <solution_file>")
        print("Example: python debug_test_generation.py generator.py solution.py")
        sys.exit(1)
    
    generator_file = sys.argv[1]
    solution_file = sys.argv[2]
    
    if not os.path.exists(generator_file):
        print(f"Error: Generator file '{generator_file}' not found")
        sys.exit(1)
    
    if not os.path.exists(solution_file):
        print(f"Error: Solution file '{solution_file}' not found")
        sys.exit(1)
    
    print("Testing Test Generation Workflow")
    print("=" * 50)
    
    # Test generating 5 test cases
    test_cases = []
    for i in range(1, 6):
        print(f"\nGenerating test case {i}...")
        success, output = test_generator(generator_file, i)
        
        if success:
            input_data = output
            print(f"✓ Generated input: {input_data}")
            
            # Run solution
            print(f"Running solution...")
            sol_success, sol_output = test_solution(solution_file, input_data)
            
            if sol_success:
                print(f"✓ Expected output: {sol_output}")
                test_cases.append({
                    'test_index': i,
                    'input_data': input_data,
                    'output_data': sol_output
                })
            else:
                print(f"✗ Solution failed: {sol_output}")
        else:
            print(f"✗ Generator failed: {output}")
    
    print(f"\n{'='*50}")
    print(f"Generated {len(test_cases)} test cases successfully")
    
    # Save test cases to JSON file
    with open('generated_test_cases.json', 'w') as f:
        json.dump(test_cases, f, indent=2)
    
    print("Test cases saved to 'generated_test_cases.json'")
    print("\nWorkflow completed successfully!")

if __name__ == "__main__":
    main()
