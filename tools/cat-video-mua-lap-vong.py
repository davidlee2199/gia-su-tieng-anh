# Cắt đoạn đúng mùa trong video Gemini rồi nối vòng lặp liền: đuôi hoà mờ vào đầu (1s), bỏ tiếng.
import subprocess, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
D = 1.0
JOBS = [("Mua he.mp4", 2.5, 9.9, "v-ha.mp4"), ("mua thu.mp4", 2.5, 8.5, "v-thu.mp4"),
        ("mua dong 2.mp4", 2.3, 8.4, "v-dong.mp4"), ("mua xuan.mp4", 3.0, 9.9, "v-xuan.mp4")]
for src, a, b, out in JOBS:
    fc = (f"[0:v]split=3[s1][s2][s3];"
          f"[s1]trim={a + D}:{b - D},setpts=PTS-STARTPTS[mid];"
          f"[s2]trim={b - D}:{b},setpts=PTS-STARTPTS[tail];"
          f"[s3]trim={a}:{a + D},setpts=PTS-STARTPTS[head];"
          f"[tail][head]xfade=transition=fade:duration={D}:offset=0[x];[mid][x]concat=n=2:v=1[o]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-filter_complex", fc, "-map", "[o]", "-an",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-profile:v", "main",
                    "-movflags", "+faststart", out], check=True)
    print(out, os.path.getsize(out) // 1024, "KB")
