#!/usr/bin/env python3

import sys

def check_answer(input_file, output_file, answer_file):
    """
    Basic checker in Python
    input_file: input data
    output_file: participant's output
    answer_file: jury's answer
    """
    
    with open(input_file, 'r') as f:
        input_data = f.read().strip().split('\n')
    
    with open(output_file, 'r') as f:
        participant_output = f.read().strip()
    
    with open(answer_file, 'r') as f:
        jury_answer = f.read().strip()
    
    # Example checking logic
    if participant_output == jury_answer:
        print("OK")
        return 0
    else:
        print(f"WRONG_ANSWER: expected '{jury_answer}', got '{participant_output}'")
        return 1

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python checker.py <input> <output> <answer>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    answer_file = sys.argv[3]
    
    exit_code = check_answer(input_file, output_file, answer_file)
    sys.exit(exit_code)
