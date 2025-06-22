#include "testlib.h"
#include <iostream>
#include <string>

using namespace std;

int main(int argc, char* argv[]) {
    setName("checker");
    registerTestlibCmd(argc, argv);
    
    // Read input
    int n = inf.readInt();
    int m = inf.readInt();
    
    // Read participant output
    string participant_answer = ouf.readString();
    
    // Read jury answer
    string jury_answer = ans.readString();
    
    // Compare answers (example: case-insensitive string comparison)
    if (participant_answer == jury_answer) {
        quitf(_ok, "Correct");
    } else {
        quitf(_wa, "Wrong answer: expected '%s', found '%s'", 
              jury_answer.c_str(), participant_answer.c_str());
    }
    
    return 0;
}
