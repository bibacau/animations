"""Tile frames into one contact sheet so a whole sequence can be reviewed in one look.

usage:
  python contact_sheet.py out.jpg <project>/output/stills 1.5,3.2,8     (stills named t<sec>.jpg)
  python contact_sheet.py out.jpg --video out.mp4 1.5,3.2,8            (grab frames from a video)
options: --cols 5 --w 427
"""
import os, subprocess, sys, tempfile
from PIL import Image

def main(argv):
    out = argv[0]; cols = 5; tw = 427
    if '--cols' in argv: cols = int(argv[argv.index('--cols') + 1])
    if '--w' in argv: tw = int(argv[argv.index('--w') + 1])
    if argv[1] == '--video':
        video, times = argv[2], [float(x) for x in argv[3].split(',')]
        tmp = tempfile.mkdtemp(); files = []
        for t in times:
            f = os.path.join(tmp, f't{t:.2f}.png')
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(t), '-i', video, '-frames:v', '1', f], check=True); files.append(f)
    else:
        d, times = argv[1], [float(x) for x in argv[2].split(',')]
        files = [os.path.join(d, f't{t:.2f}.jpg') for t in times]
    ims = [Image.open(f) for f in files]
    th = round(tw * ims[0].height / ims[0].width)
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (tw * cols, th * rows), 'black')
    for i, im in enumerate(ims): sheet.paste(im.resize((tw, th)), (tw * (i % cols), th * (i // cols)))
    sheet.save(out); print('sheet ->', out)

if __name__ == '__main__':
    main(sys.argv[1:])
