import { Box, Text } from '@chakra-ui/core'
import styled from '@emotion/styled'
import { Theme } from 'chakra'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import Link from 'next/link'
import React from 'react'
import { Helmet } from 'react-helmet'
import { Urls } from 'urls'
import { getTabTitle } from 'utils/tab-title'

export const FaqPage = observer(() => {
  return (
    <SiteLayout>
      <Box>
        <Helmet>
          <title>{getTabTitle('FAQ')}</title>
        </Helmet>

        <Box mb="6rem">
          <Box
            display="flex"
            flexDirection="column"
            maxWidth="600px"
            textAlign="center"
            mx="auto"
          >
            <Text as="h1" textAlign="center">
              Frequently Asked Questions
            </Text>

            <Text
              textAlign="center"
              maxWidth="480px"
              mx="auto"
              fontSize="lg"
              color="gray.600"
            >
              Read the FAQ and still have questions or looking for help?{' '}
              <Link passHref href={Urls.contact}>
                <a>Contact our friendly support</a>
              </Link>{' '}
              – we'll be happy to help you.
            </Text>
          </Box>

          <Box id="faq" mt="1.5rem" maxWidth="700px" mx="auto">
            <h1>General Questions</h1>

            <Question
              title="What is Wordcloudy? How can it be useful for me?"
              id="what-is-it"
            >
              <p>
                Wordcloudy is an online word art generator. It allows you to
                create unique and attractive designs in no time even with no
                artistic skills.
              </p>
              <p>
                Designs can be fully customized and downloaded in high quality
                for printing or other creative applications.
              </p>
              <p>
                It's also simple and fun to use and there are some great
                tutorials to get you started!
              </p>
            </Question>

            <Question title="Is it free to use?" id="is-it-free">
              <p>Yes, it's free for personal use!</p>
              <p>
                For commercial use, please check out our{' '}
                <Link href={Urls.pricing} passHref>
                  <a>pricing page.</a>
                </Link>{' '}
                Some additional features (like saving designs with custom fonts
                or images) are also only available in the paid version.
              </p>
            </Question>

            <Question
              title="Do I need to have an account to use Wordcloudy?"
              id="do-i-need-account"
            >
              <p>
                No, you can create and download your designs without creating an
                account.
              </p>
              <p>
                But having an account allows you to save your designs for later,
                and you'll also need an account if you're looking to{' '}
                <Link href={Urls.pricing} passHref>
                  <a>purchase one of our plans </a>
                </Link>
                to download your designs in high quality and/or use them
                commercially.
              </p>
            </Question>

            <Question
              title="How is
                it different from other word art generators?"
              id="how-is-it-different"
            >
              <p>
                Wordcloudy was created from scratch using modern technology in
                order to compete with other existing word art generators you may
                be familiar with.
              </p>
              <p>
                It's very similar in spirit to other tools (most notably
                WordArt.com), but it's more focused on the single task of
                creating amazing digital and printable designs. As such, there
                are less compromises in the design and a number of unique
                features:
              </p>
              <ul>
                <li>
                  Almost 1,000 of built-in fonts supporting dozens of languages
                </li>
                <li>
                  Huge searcheable collection of icons and vector shapes (custom
                  shapes are supported too, of course!)
                </li>
                <li>
                  Full support for vector graphics: every design created with
                  Wordcloudy can be downloaded as an SVG vector image, offering
                  the best possible quality when printed at any resolution.
                </li>
                <li>Support for multiple document sizes</li>
                <li>
                  First-class support for filling shapes with icons (not just
                  words!)
                </li>
                <li>
                  Ability to fill both shape <em>and</em> background
                </li>
                <li>And so much more!..</li>
              </ul>
            </Question>
          </Box>
        </Box>
      </Box>
    </SiteLayout>
  )
})

const QuestionLink = (props: any) => (
  <Text as="a" mr="2" my="0" color="gray.500" {...props} />
)
const QuestionStyled = styled(Box)<{ theme: Theme }>`
  p {
    font-size: ${(p) => p.theme.fontSizes.lg};
  }
`

const Question: React.FC<{
  title: string
  id: string
  children: React.ReactNode
}> = (props) => (
  <>
    <QuestionStyled mb="3rem">
      <h2 id={props.id}>
        {<QuestionLink href={`#${props.id}`}>#</QuestionLink>}
        {props.title}
      </h2>
      {props.children}
    </QuestionStyled>
  </>
)
