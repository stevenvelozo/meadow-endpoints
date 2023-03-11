#!/bin/bash

# This script is to kill the Harness, which can be annoying to do from the
# command line in the docker container when you are running remote
# debugging *or* the visual studio code debugger has gotten into a wonky
# state.

# Kill every process with Harness.js in it that isn't piping through grep...

kill $(ps aux | grep 'Harness.js' | grep -v 'grep' | awk '{print $2}')