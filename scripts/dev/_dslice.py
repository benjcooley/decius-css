from PIL import Image
im=Image.open(".cache/dockfull.png")
w,h=im.size
print("H",h)
for i,(a,b) in enumerate([(7000,9000),(9000,11000)]):
    im.crop((0,a,w,min(b,h))).save(f".cache/d{i}.png")
