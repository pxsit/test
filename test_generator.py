#!/usr/bin/env python3
import sys
import random

def main():
    if len(sys.argv) != 2:
        print("Usage: python generator.py <test_number>")
        sys.exit(1)
    
    test_number = int(sys.argv[1])
    random.seed(test_number)  # Use test number as seed for reproducible results
    
    # Generate a simple test case: two random integers
    a = random.randint(1, 100)
    b = random.randint(1, 100)
    
    print(f"{a} {b}")

if __name__ == "__main__":
    main()
