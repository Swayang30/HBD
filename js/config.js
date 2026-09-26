/* ------------------------------------------------------------
   Edit everything personal here. Nothing else needs touching.
   ------------------------------------------------------------ */
window.BDAY = {
  name: "Jiya",

  // Letters launched as fireworks in the intro (keep them short, CAPS look best).
  introLines: ["HAPPY", "BIRTHDAY", "JIYA"],

  // Curved marquee on the celebrate screen.
  curvedText: "Happiest Birthday ✦ {name} ✦ ",

  // Looping message on the celebrate screen.
  topMessage: "The world got a little brighter the day you were born, {name}. I made all of this just for you 💖",

  // Her song. Drop your own copy of the track at the path below and it becomes the
  // background music. Without the file, a music-box tune plays instead and the
  // finale shows the Spotify player so she can still play the real song.
  song: {
    title: "Belong Together",
    artist: "Mark Ambor",
    file: "assets/audio/belong-together.mp3",
    spotifyUri: "spotify:track:0lkG8eYu4LDRohl6iD3pXK",
    spotifyUrl: "https://open.spotify.com/track/0lkG8eYu4LDRohl6iD3pXK"
  },

  // The letter inside the envelope. Use \n for new lines.
  letter:
    "Happy birthday, {name}!\n\n" +
    "Thank you for every laugh, every late-night talk, and every ordinary day you turned into something I want to remember. " +
    "You make everything softer, brighter and a lot more fun.\n\n" +
    "I hope this year gives you everything you keep quietly wishing for. And wherever it takes you, I'll be right beside you, cheering the loudest.",

  // Photo cube, in order. Photos are shown whole, never cropped.
  photos: [
    { src: "assets/img/photo1.jpg", caption: "Brightest one in the crowd" },
    { src: "assets/img/photo2.jpg", caption: "Captain of my heart" },
    { src: "assets/img/photo3.jpg", caption: "Soft light, softer smile" },
    { src: "assets/img/photo4.jpg", caption: "Our little adventure" }
  ],

  // The spotlight moment.
  best: {
    src: "assets/img/best.jpg",
    tag: "My favourite moment, ever",
    quote: "My favourite day of the year will always be your birthday, because that day gave me the love of my life."
  },

  videoCaptions: ["Mirror, mirror", "Just us being us"],

  // Scratch card surprise.
  scratch: {
    title: "One birthday coupon",
    reveal: "A date night, planned entirely by me.",
    fine: "Valid any day you choose. No expiry."
  },

  // Finale.
  finalTitle: "Happy Birthday {name}",
  finalMessage:
    "Wishing you a day filled with joy, love and endless smiles. " +
    "May your heart shine brighter than the candles on your cake, " +
    "and may every moment today become a beautiful memory tomorrow.",
  signoff: "Yours, always",
  wishMade: "Wish made. I love you, {name} ❤"
};
