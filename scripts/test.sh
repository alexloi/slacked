echo "========================="
echo "Slacked: Running tests"
echo "Usage:"
echo "------"
echo "Run one test: TEST=resource npm test"
echo "Run sequence of specific tests: TEST=resource1,resource2... npm test"
echo "Run all tests: npm test"
echo "========================="

set -o errexit # EXITS SCRIPTS ON ERROR

IFS=$'\n' read -a env <<< `cat .env`
ENV=''
for line in $env
do
    ENV="$line $ENV"
done

run() {
    CMD="cd `pwd` && $ENV `which mocha`"

    case $npm_config_watch in
        (true) CMD="$CMD --watch"
    esac

    bash -c "$CMD"

    if [ $? -eq 1 ]; then
        echo 'test failing'
        exit 1
    fi
}

if [ -z "$TEST" ]; then
    echo "*** Tests to perform: All of them"

    # Tests for modules

    IFS=',' read -a tests <<< $MODULES

    for test in ${tests[@]}
    do
        echo "*** Performing test: $test"

        cd ./$test
        run
        cd ../
    done

    tests="./tests/*.test.js"

    for test in $tests
    do
        test=${test##*/}
        test=${test%.test.js}
        export TEST=$test

        echo "*** Performing test: $test"

        cd ./backend
        run
        cd ../
    done
fi

IFS=',' read -a tests <<< "$TEST"

for test in "${tests[@]}"
do
    echo "*** Performing test: $test"

    if [ ! -f "./tests/$test.test.js" ]; then
        cd ./$test
        run
        cd ../
    else
        export TEST=$test
        cd ./backend
        run
        cd ../
    fi
done

unset TEST
unset MODULES
unset ENV
