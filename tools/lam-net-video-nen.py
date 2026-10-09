# Làm nét video nền: vòng lặp 720p chất lượng cao → tách khung → Real-ESRGAN (realesr-animevideov3 x2) → ghép 1080p.
# Chạy: python up.py [tên...]   (mặc định cả 4: ha thu dong xuan)
import subprocess, sys, os, shutil, time
os.chdir(os.path.dirname(os.path.abspath(__file__)))
ESR = os.path.abspath(r"..\esrgan-dl\esr\realesrgan-ncnn-vulkan.exe")
D = 1.0
JOBS = {"ha": ("Mua he.mp4", 2.5, 9.9), "thu": ("mua thu.mp4", 2.5, 8.5), "dong": ("mua dong 2.mp4", 2.3, 8.4), "xuan": ("mua xuan.mp4", 3.0, 9.9)}
run = lambda *a: subprocess.run(list(a), check=True)
for name in (sys.argv[1:] or JOBS):
    src, a, b = JOBS[name]; t0 = time.time()
    hq, fin, fout = f"hq-{name}.mp4", f"fr-{name}", f"up-{name}"
    fc = (f"[0:v]split=3[s1][s2][s3];[s1]trim={a + D}:{b - D},setpts=PTS-STARTPTS[mid];"
          f"[s2]trim={b - D}:{b},setpts=PTS-STARTPTS[tail];[s3]trim={a}:{a + D},setpts=PTS-STARTPTS[head];"
          f"[tail][head]xfade=transition=fade:duration={D}:offset=0[x];[mid][x]concat=n=2:v=1[o]")
    run("ffmpeg", "-v", "error", "-y", "-i", src, "-filter_complex", fc, "-map", "[o]", "-an", "-c:v", "libx264", "-crf", "8", "-preset", "slow", "-pix_fmt", "yuv420p", hq)
    for d in (fin, fout): shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    run("ffmpeg", "-v", "error", "-i", hq, os.path.join(fin, "%05d.png"))
    run(ESR, "-i", fin, "-o", fout, "-n", "realesr-animevideov3", "-s", "2", "-f", "png")
    run("ffmpeg", "-v", "error", "-y", "-framerate", "24", "-i", os.path.join(fout, "%05d.png"), "-vf", "scale=1920:1080:flags=lanczos",
        "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", f"v-{name}-1080.mp4")
    print(name, os.path.getsize(f"v-{name}-1080.mp4") // 1024, "KB", round(time.time() - t0), "s", flush=True)
