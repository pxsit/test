#!/usr/bin/env python3
import sys

def main():
    # Read input
    line = input().strip()
    a, b = map(int, line.split())
    
    # Output the sum
    print(a + b)

if __name__ == "__main__":
    main()
