#!/usr/bin/env python3
"""
outline_icons.py — convert stroke-based icon SVGs into filled-outline SVGs.

Font glyphs are filled regions, but the decius icons are drawn as thin strokes
(fill:none; stroke:currentColor). This expands every stroked sub-path into a
filled polygon (round caps/joins) using Shapely's buffer, so the icon font
reproduces the stroke appearance faithfully and deterministically — no
headless browser required.

Usage: python scripts/outline_icons.py <in_dir> <out_dir> [stroke_width]
"""
import sys
import os
import glob
from svgelements import SVG, Path, Shape, Move, Close, Line, QuadraticBezier, CubicBezier, Arc
from shapely.geometry import LineString
from shapely.ops import unary_union
from shapely import set_precision

CAP_ROUND = 1   # shapely cap_style: round
JOIN_ROUND = 1  # shapely join_style: round


def flatten_segment(seg, n=18):
    """Sample a path segment into points (curves subsampled, lines as endpoints)."""
    if isinstance(seg, Line):
        return [(seg.end.x, seg.end.y)]
    if isinstance(seg, (QuadraticBezier, CubicBezier, Arc)):
        return [(seg.point(i / n).x, seg.point(i / n).y) for i in range(1, n + 1)]
    return [(seg.end.x, seg.end.y)]


def subpaths_to_polylines(path):
    """Walk a svgelements Path into a list of point lists (one per sub-path)."""
    runs = []
    pts = []
    for seg in path:
        if isinstance(seg, Move):
            if len(pts) > 1:
                runs.append(pts)
            pts = [(seg.end.x, seg.end.y)]
        elif isinstance(seg, Close):
            if pts:
                pts.append(pts[0])
                if len(pts) > 1:
                    runs.append(pts)
            pts = []
        else:
            pts.extend(flatten_segment(seg))
    if len(pts) > 1:
        runs.append(pts)
    return runs


def signed_area(pts):
    a = 0.0
    n = len(pts)
    for i in range(n):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % n]
        a += x1 * y2 - x2 * y1
    return a / 2.0


def ring_path(coords, ccw):
    """One closed ring as an SVG sub-path; orient CCW for exteriors, CW for holes."""
    pts = list(coords)
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts = pts[:-1]
    if (signed_area(pts) > 0) != ccw:
        pts = pts[::-1]
    head = f'M{pts[0][0]:.2f},{pts[0][1]:.2f}'
    rest = ''.join(f'L{x:.2f},{y:.2f}' for x, y in pts[1:])
    return head + rest + 'Z'


def geom_to_path(geom):
    polys = geom.geoms if geom.geom_type in ('MultiPolygon', 'GeometryCollection') else [geom]
    out = []
    for g in polys:
        if g.geom_type != 'Polygon':
            continue
        out.append(ring_path(g.exterior.coords, ccw=True))
        for hole in g.interiors:
            out.append(ring_path(hole.coords, ccw=False))
    return ''.join(out)


def outline_file(src, dst, half):
    svg = SVG.parse(src, reify=True)
    polys = []
    for el in svg.elements():
        if not isinstance(el, Shape):
            continue
        try:
            path = Path(el)
        except Exception:
            continue
        for pts in subpaths_to_polylines(path):
            line = LineString(pts)
            if line.length == 0:
                continue
            polys.append(line.buffer(half, cap_style=CAP_ROUND,
                                     join_style=JOIN_ROUND, resolution=10))
    if not polys:
        open(dst, 'w', encoding='utf-8').write(
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"></svg>\n')
        return
    geom = set_precision(unary_union(polys), 0.01)
    d = geom_to_path(geom)
    open(dst, 'w', encoding='utf-8').write(
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">'
        f'<path d="{d}" fill="#000" fill-rule="nonzero"/></svg>\n')


def main():
    in_dir, out_dir = sys.argv[1], sys.argv[2]
    width = float(sys.argv[3]) if len(sys.argv) > 3 else 1.25
    half = width / 2.0
    os.makedirs(out_dir, exist_ok=True)
    n = 0
    for src in sorted(glob.glob(os.path.join(in_dir, '*.svg'))):
        outline_file(src, os.path.join(out_dir, os.path.basename(src)), half)
        n += 1
    print(f'outlined {n} icons -> {out_dir}')


if __name__ == '__main__':
    main()
