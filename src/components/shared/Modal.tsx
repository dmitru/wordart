import RModal from 'react-modal'

const customStyles = {
  overlay: {
    zIndex: 1000,
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
}

RModal.setAppElement('#__next')

export type ModalProps = {
  isOpen: boolean
  onRequestClose: () => void
  children: React.ReactNode
}

export const Modal: React.FC<ModalProps> = (props) => {
  return <RModal style={customStyles} {...props} />
}
