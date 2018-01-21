#!/bin/bash
grep -n Examples: the-order-of-symbols.txt  |
    while IFS=: read n x; do
	echo "$n"
	echo "++"
	echo ".,/
	/p"	 
    done 
