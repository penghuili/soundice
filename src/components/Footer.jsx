import { Button, Divider, Image, Typography } from '@douyinfe/semi-ui';
import { RiCodeLine, RiLogoutBoxLine, RiMailLine } from '@remixicon/react';
import React from 'react';
import fastMemo from 'react-fast-memo';

import { copyContactEmailEffect } from '../shared/browser/store/sharedEffects';
import { contactEmail } from '../shared/js/constants';
import { Flex } from '../shared/semi/Flex';
import { signOut } from '../store/auth/authNetwork';

export const Footer = fastMemo(() => {
  return (
    <>
      <Divider margin="1rem" />

      <Typography.Title heading={4} style={{ textAlign: 'left' }}>
        <Image src="/icons2/icon-192.png" width={23} height={23} alt="soundice" /> Soundice: Pick
        music and podcast randomly from your Spotify account.
      </Typography.Title>

      <Typography.Title heading={5} style={{ textAlign: 'left', margin: '1rem 0 2rem' }}>
        Free, open source, no data is collected, everything happens between your browser and
        spotify.
      </Typography.Title>

      <Flex align="start" gap="1rem" m="0 0 2rem">
        <a href="https://github.com/penghuili/soundice" target="_blank">
          <Button icon={<RiCodeLine />} theme="outline">
            Source code
          </Button>
        </a>
        <Button theme="outline" icon={<RiMailLine />} onClick={copyContactEmailEffect}>
          Feedback: {contactEmail}
        </Button>
        <Button theme="outline" icon={<RiLogoutBoxLine />} onClick={signOut}>
          Logout
        </Button>
      </Flex>
    </>
  );
});
