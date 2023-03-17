import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function Token({ address }) {
  const [qr, setQR] = useState(null);

  useEffect(() => {
    QRCode.toDataURL(address).then(data => {
      setQR(data)
    })
  }, [])


  return (
      <img src={qr} />
  )
}