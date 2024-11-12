import { TabPane, Tabs } from '@douyinfe/semi-ui';
import React, { useState } from 'react';
import { useCat } from 'usecat';

import { RandomAlbum } from '../components/RandomAlbum.jsx';
import { RandomArtist } from '../components/RandomArtist.jsx';
import { RandomSong } from '../components/RandomSong.jsx';
import { PageContent } from '../shared/browser/PageContent.jsx';
import { PageHeader } from '../shared/semi/PageHeader.jsx';
import { isLoadingRandomAlbumCat, isLoadingTotalCountCat } from '../store/album/albumCats.js';

export function Home() {
  const isLoadingTotal = useCat(isLoadingTotalCountCat);
  const isLoading = useCat(isLoadingRandomAlbumCat);

  const [tab, setTab] = useState('album');

  return (
    <PageContent paddingBottom="0">
      <PageHeader title="Random Music" isLoading={isLoading || isLoadingTotal} />
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
        <TabPane tab="Liked Songs" itemKey="songs">
          <RandomSong />
        </TabPane>
      </Tabs>
    </PageContent>
  );
}
