#!/bin/bash
# Simple test runner script

echo "=== Running find_transparent.py test ==="
python3 find_transparent.py tests/test_find_transparents
echo ""

echo "=== Running apply_phone_mask.py tests ==="

echo "--- Test 0 ---"
python3 apply_phone_mask.py tests/tests_apply_mask0/refer.png tests/tests_apply_mask0/target.png
echo ""

echo "--- Test 1 ---"
python3 apply_phone_mask.py tests/tests_apply_mask1/refer.png tests/tests_apply_mask1/target.png
echo ""

echo "--- Test 2 ---"
python3 apply_phone_mask.py tests/tests_apply_mask2/refer.webp tests/tests_apply_mask2/target.webp
echo ""

echo "--- Test 3 ---"
python3 apply_phone_mask.py tests/tests_apply_mask3/refer.webp tests/tests_apply_mask3/target.png
echo ""

echo "--- Test 4 ---"
python3 apply_phone_mask.py tests/tests_apply_mask4/refer.png tests/tests_apply_mask4/target.png
echo ""

echo "--- Test 5 ---"
python3 apply_phone_mask.py tests/tests_apply_mask5/refer.png tests/tests_apply_mask5/target.png
echo ""

echo "--- Test 6 ---"
python3 apply_phone_mask.py tests/tests_apply_mask6/refer.png tests/tests_apply_mask6/target.webp
echo ""

echo "--- Test 7 ---"
python3 apply_phone_mask.py tests/tests_apply_mask7/refer.png tests/tests_apply_mask7/target.png
echo ""

echo "--- Test 8 ---"
python3 apply_phone_mask.py tests/tests_apply_mask8/refer.png tests/tests_apply_mask8/target.png
echo ""

echo "--- Test 9 ---"
python3 apply_phone_mask.py tests/tests_apply_mask9/refer.png tests/tests_apply_mask9/target.png
echo ""

echo "=== All tests completed ==="
