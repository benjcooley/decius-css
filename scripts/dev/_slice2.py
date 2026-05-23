from PIL import Image
im = Image.open('.cache/full2.png')
w, h = im.size
im.crop((0, 1250, w, 2750)).save('.cache/s-js.png')
im.crop((0, h - 2600, w, h)).save('.cache/s-bottom.png')
print('sliced', w, h)
