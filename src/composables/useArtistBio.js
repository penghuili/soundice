import { ref } from 'vue';

export function useArtistBio() {
  const selectedArtist = ref(null);

  function openArtist(artist) {
    const name = artist?.name || artist?.title;
    if (!name) return;
    selectedArtist.value = {
      id: artist.id || null,
      name,
      url: artist.url || null,
      image: artist.image || null,
    };
  }

  function closeArtist() {
    selectedArtist.value = null;
  }

  return { selectedArtist, openArtist, closeArtist };
}
