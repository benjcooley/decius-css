import sys
s = open(sys.argv[1], encoding='utf-8').read()
i = 0; ln = 1; incmt = False; opens = []; stray = []
while i < len(s):
    two = s[i:i+2]
    if not incmt and two == '/*':
        opens.append(ln); incmt = True; i += 2; continue
    if incmt and two == '*/':
        incmt = False; i += 2; continue
    if not incmt and two == '*/':
        stray.append(ln); i += 2; continue
    if s[i] == '\n':
        ln += 1
    i += 1
print('stray closes at lines:', stray)
print('ends inside comment:', incmt)
