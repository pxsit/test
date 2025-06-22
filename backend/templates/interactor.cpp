#include "testlib.h"
#include <iostream>
#include <vector>

using namespace std;

int main(int argc, char* argv[]) {
    setName("interactor");
    registerInteraction(argc, argv);
    
    // Example interactive problem
    int secret = rnd.next(1, 1000);
    int queries = 0;
    const int MAX_QUERIES = 10;
    
    cout << "? " << 1 << " " << 1000 << endl;
    cout.flush();
    
    while (queries < MAX_QUERIES) {
        int guess;
        if (!(cin >> guess)) {
            quitf(_wa, "Can't read participant's guess");
        }
        
        queries++;
        
        if (guess == secret) {
            cout << "! " << secret << endl;
            cout.flush();
            quitf(_ok, "Correct! Found in %d queries", queries);
        } else if (guess < secret) {
            cout << ">" << endl;
        } else {
            cout << "<" << endl;
        }
        cout.flush();
    }
    
    quitf(_wa, "Too many queries");
    
    return 0;
}
