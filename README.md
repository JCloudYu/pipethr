# pipethr #
This module is aimed to provide functionalities similar to ```tee``` command but with log division mechanism that allows developers to divide log out hourly, daily, monthly and daily.

## Install ##
```bash
npm install -g pipethr
```

## Usage ##
```bash
# Use with pipe
cat file | pipethr --daily output-{}.log
```

```bash
# Use as parent process
pipethr --hourly output-{}.log -- subcommand cmd_arg1 cmd_arg2...
```

## Important Notes ##
- This program awaits and reads inputs from STDIN and write to the target file
- This program will not respond to SIGINT signal (Ctrl + C)
- This program can be terminted by SIGTERM or SIGQUIT( Ctrl + \ )