# Project Tape (Tentative Title)
Project Tape is a browser-based rhythm game built with the Next.js Framework

![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![Threejs](https://img.shields.io/badge/threejs-black?style=for-the-badge&logo=three.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=black)
![Blender](https://img.shields.io/badge/blender-%23F5792A.svg?style=for-the-badge&logo=blender&logoColor=white)

## Getting Started
You can visit the deployed game [here](https://project-tape.vercel.app/)

## Gameplay
<img src="https://github.com/user-attachments/assets/912a0318-4076-4037-91ba-2ff2ae284d3b" width=640 height=360>
<img src="https://github.com/user-attachments/assets/111febf9-384f-491e-8787-27527c24c2a8" width=640 height=360>

<img src="https://github.com/user-attachments/assets/1dd5fdd6-7b2f-445c-8bbd-9233cc830be5" width=640 height=360>
<img src="https://github.com/user-attachments/assets/e8b21db4-ec5f-4bba-aeb1-fc93d683a6d1" width=640 height=360>

## Editor
<img src="https://github.com/user-attachments/assets/973976c4-9846-45eb-b583-91b37e94e26f" width=640 height=360>
<img src="https://github.com/user-attachments/assets/ad15c158-0553-4cc4-b286-80cdecb712d0" width=640 height=360>


## Running Project Tape Yourself

After pulling the repo onto your local machine, you can run the development server with:

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Project Tape uses Supabase's PostgreSQL Database for user authentication and beatmap storage

Create a new Supabase project, and fill in the keys here in an .env file:
```
NEXT_PUBLIC_SUPABASE_URL= ""
NEXT_PUBLIC_SUPABASE_ANON_KEY= ""
```

## How Gameplay works
```
useEffect(() => {
    let animationFrameId: number;
    let lastTime: number | null = null;

    const updateTime = (currentTime: number) => {
        if (!lastTime) lastTime = currentTime;
        const deltaTime = currentTime - lastTime; 
        lastTime = currentTime;

        if (!stPaused) {
            setTime((prevTime) => prevTime + deltaTime); 
        }

        animationFrameId = requestAnimationFrame(updateTime); // Call next frame
    };

    if (stopwatchActive) {
        animationFrameId = requestAnimationFrame(updateTime); // Start the timer
    }

    return () => cancelAnimationFrame(animationFrameId); 
}, [stopwatchActive, stPaused]);
```
- What conducts both the timing of when a note is created, as well as the timing window for a note is the timer above. Before, setTimeout() was used, to increment my timer every 10ms. 

- Limiting to 10ms could make timing out of sync for low frame rate devices, and also didn't align well with the 1/16 notes that I had implemented in my editor

- By using requestAnimationFrame, the timer increments sync with the framerate of the device, preventing desyncing, and also means 1/16 notes can truly be 1/16 of a second. Since timer updates per frame, the higher the frame rate of the user's device, the more precise the notes creation and timing window becomes.

```
useEffect(() => {
    if (leftNoteIndex < leftNotes.current.length && time >= leftNotes.current[leftNoteIndex][0]) {
        if (leftNotes.current[leftNoteIndex][1] === "FL") { // First Lane
            createBar(lane_one, false)
            setLeftNoteIndex((index) => index + 1);
        }
        if (leftNotes.current[leftNoteIndex][1] === "SL") { // Second Lane
            createBar(lane_three, false)
            setLeftNoteIndex((index) => index + 1);
        }
    }   
}, [time, leftNoteIndex])
```
- The code above is one example of how a note is created. 

- This is an example of what leftNotes would be:
  ```
  [[1430,"FL"],[1740,"FL"],[2070,"FL"],[2420,"FL"],[3690,"FL"]]
  ```
  The number represents the millisecond the note is created, and the string represents the lane the note appears in.

- In the code above, a state "leftNoteIndex" is used, to iterate through the leftNotes list. I found it more performant and convinent to iterate through the list with a pointer, as opposed to using slice(1) on the list for every note until it creates

## Roadmap
- [x] Complete the beatmap editor.
- [ ] Implement backend storage for audio files.
- [ ] Add map/menu customizations.
- [ ] Support custom art for each stage.
- [ ] Continue building and refining 3D models.
- [ ] In the long run, transition from DOM manipulation to Canvas/WebGL for better performance.


## Learn More
Here are some great resources I used while developing Project Tape
- [React Three Fiber Docs](https://r3f.docs.pmnd.rs/getting-started/introduction)
- [Helped with importing Blender models](https://www.youtube.com/watch?v=q7yH_ajINpA&t=901s)
- [Great Guide on how to get the PS1 style with Blender](https://www.youtube.com/watch?v=390peMdni7s&t=421s)
- [What helped inspire the asethetic for me to use](https://www.youtube.com/watch?v=M4RhBojsbyM)
- [Wavesurfer](https://wavesurfer.xyz/) allowed me to get the waveforms needed to help with note visualizations.
- [react-window](https://react-window.vercel.app/#/examples/list/fixed-size) allowed me to create a list of elements, where each element corresponded with a 1/16 note in a beatmap. It limited the number of elements React needed to render, grealy improving performance.
- [Drei](https://drei.docs.pmnd.rs/getting-started/introduction) has a great collection of resources, I particularly took advantage of [HTML](https://drei.docs.pmnd.rs/misc/html#html).
- [GSAP](https://gsap.com/) was primarly for a lot of in-game animations and it is a overall a great tool to use with ThreeJS and to do animation work.
- [Supabase](https://supabase.com/docs/guides/database/overview) is a great backend service that I'll still likely use for future projects.
