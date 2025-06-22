import random

def generate_test():
    # Example generator in Python - modify as needed
    n = random.randint(1, 100)
    m = random.randint(1, 100)
    
    print(n, m)
    
    numbers = [random.randint(1, 1000) for _ in range(n)]
    print(' '.join(map(str, numbers)))

if __name__ == "__main__":
    generate_test()
