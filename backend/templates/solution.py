n, m = map(int, input().split())
numbers = list(map(int, input().split()))

# Example solution in Python
numbers.sort()
result = numbers[0] + numbers[-1]
print(result)
