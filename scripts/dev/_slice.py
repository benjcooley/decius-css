from PIL import Image
im = Image.open('.cache/site-full.png')
w, h = im.size
for i, (a, b) in enumerate([(1700, 4400), (4400, 6900), (6900, 9000)]):
    im.crop((0, a, w, b)).save(f'.cache/slice{i}.png')
print('sliced', w, h)
