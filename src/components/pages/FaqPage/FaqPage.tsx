import { Box, Text, Stack, Button } from '@chakra-ui/core'
import styled from '@emotion/styled'
import { Theme } from 'chakra'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import Link from 'next/link'
import React from 'react'
import { css } from '@emotion/core'
import { Helmet } from 'react-helmet'
import { Urls } from 'urls'
import { getTabTitle } from 'utils/tab-title'
import { GoMail } from 'react-icons/go'
import { StartCreatingCta } from 'components/pages/LandingPage/LandingPage'

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
            </Text>
            <Stack spacing="3" direction="row" mx="auto" mt="2">
              <Button
                colorScheme="primary"
                size="lg"
                as="a"
                target="_blank"
                href="https://wordcloudy.com/blog/tag/tutorials/"
              >
                Open tutorials
              </Button>

              <Link passHref href={Urls.contact}>
                <Button
                  variant="outline"
                  size="lg"
                  as="a"
                  leftIcon={<GoMail />}
                >
                  Ask us!
                </Button>
              </Link>
            </Stack>
          </Box>

          <Box id="faq" mt="4.5rem" maxWidth="700px" mx="auto">
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
                for social media, blogs, presentations or for printing on cards,
                canvases, posters, merchandise or for other creative
                applications.
              </p>
              <p>
                It's also simple and fun to use and{' '}
                <a href="https://wordcloudy.com/blog/tag/tutorials/">
                  there are tutorials
                </a>{' '}
                to get you started!
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
              title="Is there special offers for educational use?"
              id="is-it-free-for-education"
            >
              <p>
                We may offer our Unlimited plan for free or with a significant
                discount for students, non-profits or folks working in
                education. Please write to us and tell us about your intended
                use for Wordcloudy – eligibility is determined on case-by-case
                basis.
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
                it different from other word art generators (e.g. WordArt.com)?"
              id="how-is-it-different"
            >
              <p>
                Wordcloudy is focused on the single task of creating amazing
                digital and printable word art designs. It was carefully
                designed from scratch to help you save your time and produce
                great-looking results.
              </p>
              <p>To that end, it offers some of the unique features:</p>
              <ul>
                <li>
                  ✅ Almost 1,000 of built-in fonts supporting dozens of
                  languages
                </li>
                <li>✅ Custom page sizes</li>
                <li>
                  ✅ Huge searcheable collection of icons and vector shapes
                  (custom shapes are supported too, of course!)
                </li>
                <li>
                  ✅ Ability to fill both shape <em>and</em> background layers.
                </li>
                <li>
                  ✅ Full support for vector graphics: every design created with
                  Wordcloudy can be downloaded as an SVG vector image, offering
                  the best possible quality when printed at any resolution.
                </li>
                <li>✅ Filling shapes with icons (not just words!)</li>
                <li>And so much more!..</li>
              </ul>
            </Question>
          </Box>

          <Box mt="1.5rem" maxWidth="700px" mx="auto">
            <h1>Using Wordcloudy</h1>

            <Question
              title="How do I create word art from my custom image file?"
              id="custom-images"
            >
              <p>
                We have a tutorial on how to do it:{' '}
                <a
                  href="https://wordcloudy.com/blog/create-wordcloud-from-custom-image/"
                  target="_blank"
                >
                  check it out!
                </a>
              </p>
            </Question>

            <Question title="Can I use a text as a shape?" id="custom-text">
              <p>
                Yes, you can! In the "Shapes" left panel, at the very top,
                choose "Shape: text". You'll be able to customize the font and
                color, multi-line text is also supported.
              </p>
            </Question>

            <Question
              title="Can I export or import my words data?"
              id="export-import"
            >
              <p>
                You can import words on the "Words" left panel, click "Import"
                to import words from a web page or a CSV file (here's an example{' '}
                <a
                  href="https://docs.google.com/spreadsheets/d/1Az4e4vnWCTu823VDOyRyGvOACjmNsDEX13It_I8coR0/edit?usp=sharing"
                  target="_blank"
                >
                  Google Sheet
                </a>
                ).
              </p>
              <p>
                You can also export your word list to a CSV file, which you can
                later edit in MS Excel or Google Sheets.
              </p>
            </Question>

            <Question
              title="Can I fill the whole canvas with words, instead of filling a shape?"
              id="filling-whole-canvas"
            >
              <p>
                Yes you can! Here's how: in the editor, open the Shape tab, then
                choose "Fill whole canvas" as your shape type in the top "Shape"
                dropdown.
              </p>
            </Question>

            <Question
              title={`I'd like to do a 8 x 10\" print. Can I change the page aspect ratio?`}
              id="aspect-ratio"
            >
              <p>
                You can customize page size in the editor by going to the
                top-left "Menu", and then choosing the "Page Size..." option.
              </p>
            </Question>
          </Box>

          <StartCreatingCta />
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

export const Question: React.FC<{
  title: string
  id?: string
  children: React.ReactNode
}> = (props) => (
  <>
    <QuestionStyled mb="2rem" fontSize="lg">
      <h2
        id={props.id}
        css={css`
          font-weight: 600;
          font-size: 22px;
          font-family: 'Nunito', sans-serif;
        `}
      >
        {props.id && <QuestionLink href={`#${props.id}`}>#</QuestionLink>}
        {props.title}
      </h2>
      {props.children}
    </QuestionStyled>
  </>
)
