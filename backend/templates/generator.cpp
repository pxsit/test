#include "testlib.h"
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main(int argc, char* argv[]) {
    registerGen(argc, argv, 1);
    
    // Example generator - modify as needed
    int n = rnd.next(1, 100);  // Random number from 1 to 100
    int m = rnd.next(1, 100);  // Random number from 1 to 100
    
    cout << n << " " << m << endl;
    
    for (int i = 0; i < n; i++) {
        cout << rnd.next(1, 1000);  // Random number from 1 to 1000
        if (i < n - 1) cout << " ";
    }
    cout << endl;
    
    return 0;
}
