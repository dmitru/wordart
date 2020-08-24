import { Box, Text, Stack, Button } from '@chakra-ui/core'
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
import { GoMail } from 'react-icons/go'

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
                  Write to us
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
                for printing on cards, canvases, posters, merchendise or for
                other creative applications.
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
                it different from other word art generators (e.g. WordArt.com)?"
              id="how-is-it-different"
            >
              <p>
                Wordcloudy was created from scratch using modern technology in
                order to compete with other existing word art generators, like
                WordArt.com.
              </p>
              <p>
                Worcloudy is more focused on the single task of creating amazing
                digital and printable designs. It doesn't have the features that
                it doesn't need. As such, there are less compromises in its
                design as well as some unique features:
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
                <li>Support for custom page sizes</li>
                <li>
                  First-class support for filling shapes with icons (not just
                  words!)
                </li>
                <li>
                  Ability to fill both shape <em>and</em> background, or both
                </li>
                <li>And so much more!..</li>
              </ul>
            </Question>
          </Box>

          <Box mt="1.5rem" maxWidth="700px" mx="auto">
            <h1>Using Wordcloudy</h1>

            <Question
              title="Can I cover the whole canvas with words instead of filling shapes?"
              id="filling-whole-canvas"
            >
              <p>
                Yes you can! Here's how: in the editor, open the Shape tab, then
                choose "Fill whole canvas" as your shape type in the top "Shape"
                dropdown.
              </p>
            </Question>

            <Question
              title="Can I choose a specific aspect ratio, e.g. for a square Instagram post or for portrait A4 paper?"
              id="filling-whole-canvas"
            >
              <p>
                Yes, you can customize page size by choosing "Page Size..."
                option in the top-left menu in the editor.
              </p>
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
