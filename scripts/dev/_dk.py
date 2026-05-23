from PIL import Image
im=Image.open(".cache/df2.png")
w,h=im.size
print("H",h)
for i,(a,b) in enumerate([(13200,15400)]):
    im.crop((0,a,w,min(b,h))).save(f".cache/dk{i}.png")
