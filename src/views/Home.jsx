import { Dropdown, Spin, TabPane, Tabs } from '@douyinfe/semi-ui';
import { RiCodeBoxLine, RiDiceLine, RiLogoutBoxLine, RiMenuLine } from '@remixicon/react';
import React, { useState } from 'react';
import { useCat } from 'usecat';

import { RandomAlbum } from '../components/RandomAlbum.jsx';
import { RandomArtist } from '../components/RandomArtist.jsx';
import { RandomPodcast } from '../components/RandomPodcast.jsx';
import { RandomSong } from '../components/RandomSong.jsx';
import { PageContent } from '../shared/browser/PageContent.jsx';
import { IconButton } from '../shared/semi/IconButton.jsx';
import { Link } from '../shared/semi/Link.jsx';
import { PageHeader } from '../shared/semi/PageHeader.jsx';
import { isLoadingTotalCountCat } from '../store/album/albumCats.js';
import {
  isLoadingAllArtistsCat,
  isLoadingTotalArtistsCountCat,
} from '../store/artist/artistCats.js';
import { signOut } from '../store/auth/authNetwork.js';
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
    <PageContent paddingBottom="0">
      <PageHeader
        title="Soundice"
        isLoading={isLoading}
        spin={<Spin indicator={<RiDiceLine />} style={{ marginLeft: '1rem' }} />}
        right={
          <Dropdown
            trigger="click"
            position="bottomLeft"
            clickToHide
            render={
              <Dropdown.Menu>
                <Dropdown.Item icon={<RiCodeBoxLine />}>
                  <Link href="https://github.com/penghuili/randomusic" target="_blank">
                    Source code
                  </Link>
                </Dropdown.Item>
                <Dropdown.Item icon={<RiLogoutBoxLine />} onClick={signOut}>
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            }
          >
            <IconButton icon={<RiMenuLine />} theme="borderless" />
          </Dropdown>
        }
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
    </PageContent>
  );
}
