#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    // Example solution - modify as needed
    int n, m;
    cin >> n >> m;
    
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    
    // Your solution logic here
    sort(a.begin(), a.end());
    
    cout << a[0] + a[n-1] << endl;
    
    return 0;
}
