import LZString from "lz-string";

const data = `36 b0 44 1b c0 75 41 6c 14 c0 2e 00 b0 3d 80 4d a0 2e 69 ae 
02 30 15 c0 73 68 01 a6 80 1b 38 03 73 82 ac 07 67 34 2b 68 
a0 39 01 0d e2 c7 7d 8b 2d 13 80 27 22 01 9c b3 06 87 8c 94 
50 13 42 60 0a c0 11 80 03 33 02 bd 60 c6 80 17 c0 2e b3 04 
01 2d e1 88 4d c0 03 96 39 04 01 d8 98 01 e0 16 44 c5 0a 26 
b0 a8 06 c4 af d2 80 0b 00 27 30 43 00 13 00 33 0f a6 82 00 
31 b6 80 0a 92 01 29 00 01 24 5a 9a 40 14 83 9a 78 5a b8 78 
5a 61 66 1a b0 72 83 1a 40 38 8b a2 60 a8 01 3c 62 59 9c 00 
17 8a 3d 9c 00 3c 80 19 af 58 a2 16 38 60 46 b4 09 98 8a 00 
07 0f 9a 8a b6 81 51 40 2d 1a 8f 92 f8 70 62 51 59 45 52 83 
00 1d 14 5a da a0 59 5a be b3 3c 25 ad b4 15 bc e2 9c 82 1c 
22 12 37 8c 6d c9 bc 6b c3 f4 02 a6 24 66 9b 43 05 d2 80 f4 
7a 66 15 9c 23 75 01 3c 5e c3 40 84 33 e7 16 fa 60 e4 7f 00 
74 0b 48 a6 83 03 f4 e0 e9 1d 01 0d 0d 87 21 bc 6a 25 22 2b 
ed 0f 46 03 b1 3a 3c 7e 34 0f 66 e1 c0 c4 56 4e 1c 4e 09 26 
80 00 85 09 62 4c 26 06 09 c5 26 81 98 71 4e 05 0e 20 40 a0 
8a e0 00 11 09 a5 9e c9 ce 80 18 f4 a0 23 18 0e 45 75 40 60 
e9 b8 42 09 0c 59 41 a1 d1 18 cc 56 1d 0b 83 c0 37 f1 8d cc 
11 38 9b 9a 02 b0 ca a8 00 4f 45 7f 56 4b f4 63 ec 7c 91 60 
a0 52 21 11 f1 4d 02 ea 30 bb d1 a4 09 06 19 8c ad 0b 35 9a 
10 e6 71 b8 3c 5e 45 2f 9f c4 a2 0a 84 22 91 29 ac 41 27 4e 
4a a4 32 59 5c bd 9f 28 56 2a 95 ca 95 1a 9d 41 a4 d3 88 b5 
e0 1d 2e 9f 40 64 34 50 8c c6 a0 09 b4 d6 6f 76 c2 81 16 e1 
15 9a c3 65 b7 08 ed 2a 87 22 ca d4 e6 a7 3a 83 2e 88 4e 34 
2e ec 4e 7a 8b 30 be 4a 72 3a 95 80 c6 c6 e9 b8 d0 63 32 17 
bb 87 f6 11 1f 2a 4f de 46 7d a7 8e af 60 e6 1e 10 97 78 3f 
a8 29 27 c4 f1 7c 69 4c 4e 30 65 98 66 5c c7 65 55 45 0a 45 
00 f9 0a 01 00 14 85 11 5b e7 15 25 69 56 52 79 15 64 c5 52 
e5 35 0d 4b 50 80 71 17 9d 06 d1 0d 01 04 d1 60 cd 7a 11 42 
61 4d 36 06 d0 23 c7 4a 21 d2 11 44 3f 9e 08 40 50 00 19 40 
04 76 10 89 31 4d 16 18 94 60 90 34 89 f6 15 06 4e 08 a6 3d 
81 81 f0 54 77 c7 11 80 a1 50 48 c6 81 4c 73 12 c1 80 6c 17 
cd 35 71 dc 4f 0d e5 cd f3 30 8a 26 08 4b 24 85 27 49 32 1c 
8f 24 9c 4a 79 d1 b3 d9 9b 7a 9a 8b 6c 3b 76 93 a1 e9 fa 41 
98 4c c0 07 66 18 71 98 e6 05 8e b6 9d d6 4d 9b 65 72 0e 4b 
25 73 38 2e 52 3a e1 7d 77 17 c4 91 44 8f 20 25 15 13 14 73 
cb 10 fd e3 1b dd 4d 44 b4 fd c5 11 19 8f 5c af d7 ca 54 fa 
5a f6 fd 7f 0c a2 ab 25 00 d7 49 11 ab 5f 3a ac 0c bd 8a c6 
4a 0d 64 60 96 3e 0c 43 90 c1 58 55 14 30 a9 46 53 95 70 e5 
56 0f 55 35 52 1b 51 4a f5 0a 3e d0 68 ad 3a 33 00 62 68 a6 
25 90 da 8d 06 89 d2 e3 7e 41 29 e7 d5 48 3c b9 47 29 f6 20 
80 a2 53 c9 3f 1c 36 2d 7a a2 bf 44 d2 61 24 d7 4f d2 ca c6 
91 c2 33 33 53 20 21 08 2c a0 da cb 2d 6c ca c1 c9 ac 9c 86 
d7 62 a9 6a 0f 24 b6 f2 bb 3f 37 b4 0b 82 f1 92 63 0a c7 68 
12 72 8b 67 58 b1 1a 5d 82 44 ad 76 4b 60 2d c7 73 1d 1e 56 
bb 31 8c ac 4e b4 f1 ea 2f 0f b1 ad b9 4a fa 7e f2 0b 1f 0e 
b9 f7 fb 40 f6 75 4b c4 9a a4 2f f2 cb c9 6a b5 9f f9 ea cf 
cb f6 81 06 b6 43 91 1b 79 7e 42 6b 42 1a 09 46 6e c2 15 25 
53 87 c2 d5 22 25 69 23 a9 e4 1c 8b b5 8e ea 3b 68 b5 18 eb 
50 ea b6 a8 c7 53 89 75 84 44 00 86 11 ec 5f 5b ac 3d c2 03 
90 24 09 fd bd 90 30 28 18 19 3e 5f 8c be ed 35 95 fb 53 40 
63 31 33 19 b3 2c 18 89 46 48 7c 77 2c ec aa d1 cb ad 9c 85 
cd ce 47 5b 66 95 a7 46 7b 00 be 14 1d 42 d1 c2 2e 59 56 68 
ae 70 2f e2 d1 82 9f 5d 19 2b 9b 73 4a e9 f2 b7 9e ca 05 e0 
28 5b 7d de d1 73 9d 75 b9 9e e0 f2 aa 72 d9 60 af 03 47 9f 
c2 59 6b 7b e9 7a 79 02 87 91 61 ab 04 06 96 45 5d 83 30 51 
a3 5d 42 a6 e8 07 5a c2 e6 83 68 dc 23 96 d5 bc df 5a 9d f6 
3f 6f 35 e8 cb 56 8e 62 8e e7 63 8e 74 e0 e9 07 db f9 02 29 
90 72 15 11 e0 98 b4 8f d1 4c 06 41 3b 19 2c c8 78 5e 9e 65 
4e d8 d1 a3 c4 1b 21 59 ec b5 65 ac 45 1f 39 c5 77 2c 5d db 
29 75 f2 e5 cf b1 f3 2a eb 8c 6b 9d 24 26 f5 d8 98 b9 52 60 
39 5b 95 30 ee b4 d2 59 bc 19 66 bc d9 90 0c de 25 51 84 3e 
66 18 3d 58 5c f4 56 a0 01 7a 05 1e 6f f8 d7 37 09 ba b3 cf 
a8 41 25 63 bd 86 8b a3 1a 28 52 6b a1 13 e9 85 66 8e 10 be 
8b 44 d8 df 5d 49 6d 58 a6 d1 b6 b4 4e da 3f 0e 08 ed 74 75 
b1 76 5f df 7a dc 77 47 00 bd 09 81 f4 22 56 aa ed 00 c4 18 
43 18 60 8c 51 91 4a 47 4f a8 98 74 b8 0f fa 86 51 3b 40 9c 
ca 0c 0b 08 c6 52 98 89 05 43 14 13 9c e1 9e 70 46 4d 88 ba 
79 12 e9 d9 f0 7f 94 21 08 3a bb 85 32 19 14 28 4c 52 a1 8b 
8c 26 d0 8d c2 95 3b bf d7 4a ff 53 29 30 d5 e3 c2 e5 b0 f7 
61 10 9c 78 c2 06 67 cc c4 63 88 91 1c df 86 08 ce 18 79 44 
75 4f 11 5e 3a f3 6f 68 2a ac e4 61 f4 51 da c5 45 eb 79 a8 
6c 34 75 f3 36 da 3f 52 98 8f e4 63 0c 76 d3 7e f7 c4 ea bb 
6f e3 08 f8 85 d5 fe c3 03 63 04 48 85 24 64 8a 83 92 0a 49 
4a 47 75 22 03 be af 8b d2 f1 dd 31 40 90 67 03 42 64 60 ce 
d0 0b 38 c3 34 1f 0d f2 61 71 6c 49 37 04 a4 ee c6 92 b1 ba 
71 c6 23 8b 27 8e 72 13 38 f2 53 74 38 91 88 a7 b7 1a 65 dd 
ba 5f 76 66 82 df a5 d4 85 60 d3 ba 54 f7 ee 5d 58 59 b0 ec 
50 49 17 85 4e 69 ea 10 73 a2 81 e9 8a 37 82 b2 19 43 44 67 
6c f9 19 ad 8f a8 05 3e aa 3f 59 e1 59 9c 44 75 19 14 59 7c 
0c c7 db 1d a7 b4 d6 49 88 15 cb 34 e8 ba 31 01 74 e0 15 d1 
ba 81 01 83 04 7b a2 a1 22 24 65 f0 11 8e 48 30 76 9c 03 a3 
98 0f b9 10 31 e7 03 64 e2 12 2c 90 77 79 a0 13 e6 a0 dc e1 
83 e2 5f c9 46 11 30 14 f9 60 59 8d 2b 88 51 21 90 a0 98 e4 
98 58 dc e2 bc 2a 9c 27 09 2b 14 f3 6a 52 e4 39 4e 11 59 49 
98 b3 16 1b 53 69 71 51 c5 4b d2 7b f3 2a 50 4b d7 91 2b 8d 
24 a8 44 4f 29 69 4a a3 4d 4e d5 ec 3e 96 ef 35 60 84 c6 56 
b6 a2 ec aa 67 a8 82 24 b4 79 5a d1 d1 e2 a1 fa db 67 e4 2b 
d6 52 c8 7e 92 bb 67 bb 04 09 ed bd 83 8d f6 b2 5f 61 1c e0 
82 a1 14 a0 45 98 3e 0a 21 bc ac 55 1c 7c 6c 73 f1 76 12 05 
1a 98 12 9d 5e 78 47 35 96 a6 27 a0 fa cb f2 91 bf cd 46 78 
39 d4 57 07 cc 42 21 7e 30 9c 5e a1 b8 93 02 94 1d 11 66 e5 
4a 65 3b b9 34 de e9 1a 31 5b 48 19 fc 36 f0 26 ca a4 9b 73 
4d 2b 4d 62 c3 36 a2 de 9f 8a 67 bb ef e1 ca d6 45 32 d2 da 
ca 2b 79 f2 e5 d5 a8 88 18 20 00 00`;

const dataSingleLine = data.split("\n").join("");

const fromHexString = (hexString: string) =>
  hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))[0];

const dataz = Uint8Array.from(
  dataSingleLine.split(" ").map((s) => fromHexString(s))
);

const nestedArrays = JSON.parse(LZString.decompressFromUint8Array(dataz)!);

let x: unknown[] = [];
for (const notYetJson in nestedArrays) {
  x.push(JSON.parse(nestedArrays[notYetJson][0]));
}

console.log(JSON.stringify(x, undefined, 2));

export {};
