import { Dropdown, TabPane, Tabs } from '@douyinfe/semi-ui';
import { RiCodeBoxLine, RiLogoutBoxLine, RiMenuLine } from '@remixicon/react';
import React, { useState } from 'react';
import { useCat } from 'usecat';

import { RandomAlbum } from '../components/RandomAlbum.jsx';
import { RandomArtist } from '../components/RandomArtist.jsx';
import { RandomSong } from '../components/RandomSong.jsx';
import { PageContent } from '../shared/browser/PageContent.jsx';
import { IconButton } from '../shared/semi/IconButton.jsx';
import { Link } from '../shared/semi/Link.jsx';
import { PageHeader } from '../shared/semi/PageHeader.jsx';
import { isLoadingRandomAlbumCat, isLoadingTotalCountCat } from '../store/album/albumCats.js';
import { signOut } from '../store/auth/authNetwork.js';

export function Home() {
  const isLoadingTotal = useCat(isLoadingTotalCountCat);
  const isLoading = useCat(isLoadingRandomAlbumCat);

  const [tab, setTab] = useState('album');

  return (
    <PageContent paddingBottom="0">
      <PageHeader
        title="Randomusic"
        isLoading={isLoading || isLoadingTotal}
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
        <TabPane tab="Liked Songs" itemKey="songs">
          <RandomSong />
        </TabPane>
      </Tabs>
    </PageContent>
  );
}
