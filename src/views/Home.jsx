import { Spin, TabPane, Tabs } from '@douyinfe/semi-ui';
import { RiDiceLine } from '@remixicon/react';
import React, { useState } from 'react';
import { useCat } from 'usecat';

import { Footer } from '../components/Footer.jsx';
import { RandomAlbum } from '../components/RandomAlbum.jsx';
import { RandomArtist } from '../components/RandomArtist.jsx';
import { RandomPodcast } from '../components/RandomPodcast.jsx';
import { RandomSong } from '../components/RandomSong.jsx';
import { PageContent } from '../shared/browser/PageContent.jsx';
import { PageHeader } from '../shared/semi/PageHeader.jsx';
import { isLoadingTotalCountCat } from '../store/album/albumCats.js';
import {
  isLoadingAllArtistsCat,
  isLoadingTotalArtistsCountCat,
} from '../store/artist/artistCats.js';
import { isLoadingTotalPodcastsCountCat } from '../store/podcast/podcastCats.js';
import { isLoadingTotalSongsCountCat } from '../store/song/songCats.js';

export function Home() {
  const isLoadingAlbumsTotal = useCat(isLoadingTotalCountCat);
  const isLoadingArtistsTotal = useCat(isLoadingTotalArtistsCountCat);
  const isLoadingArtist = useCat(isLoadingAllArtistsCat);
  const isLoadingPodcastsTotal = useCat(isLoadingTotalPodcastsCountCat);
  const isLoadingSongsTotal = useCat(isLoadingTotalSongsCountCat);

  const [tab, setTab] = useState('album');

  const isLoading =
    isLoadingArtist ||
    isLoadingAlbumsTotal ||
    isLoadingArtistsTotal ||
    isLoadingPodcastsTotal ||
    isLoadingSongsTotal;

  return (
    <PageContent>
      <PageHeader
        title="Soundice"
        isLoading={isLoading}
        spin={<Spin indicator={<RiDiceLine />} style={{ marginLeft: '1rem' }} />}
      />
      <Tabs
        type="line"
        activeKey={tab}
        onChange={setTab}
        size="small"
        style={{ marginLeft: '0.5rem' }}
      >
        <TabPane tab="Albums" itemKey="album">
          <RandomAlbum />
        </TabPane>
        <TabPane tab="Artists" itemKey="artists">
          <RandomArtist />
        </TabPane>
        <TabPane tab="Songs" itemKey="songs">
          <RandomSong />
        </TabPane>
        <TabPane tab="Podcasts" itemKey="podcasts">
          <RandomPodcast />
        </TabPane>
      </Tabs>

      <Footer />
    </PageContent>
  );
}
