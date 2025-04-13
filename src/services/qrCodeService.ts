import QRCode from 'qrcode';

interface HoaDon {
  invoice_code: string;
  total_amount: number;
}

interface Bank {
  ma_dinh_danh: string;
  bank_id: string;
  recipient_account_number: string;
}

export class QRCodeService {
  async generateQRCode(hoaDon: HoaDon, bank: Bank): Promise<string> {
    const qrContent = this.generateFinalQRCodeContent(hoaDon, bank);
    return await QRCode.toDataURL(qrContent, { errorCorrectionLevel: 'H' });
  }

  private generateEMVCoQRContent(hoaDon: HoaDon, bank: Bank): string {
    const amount = hoaDon.total_amount.toFixed(0);
    const amountLength = amount.length.toString().padStart(2, '0');
    const maHoaDon = hoaDon.invoice_code;
    const maDau = '00020101021';
    const dinhDanh = '0010A00000072701';
    const xacThuc = '0208QRIBFTTA530370454';

    return (
      maDau +
      bank.ma_dinh_danh +
      dinhDanh +
      bank.bank_id +
      bank.recipient_account_number +
      xacThuc +
      amountLength +
      amount +
      '5802VN62' +
      `200816${maHoaDon}` +
      '6304'
    );
  }

  private calculateCRC(data: string): string {
    let crc = 0xffff;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
      }
    }
    return ((crc & 0xffff) >>> 0).toString(16).padStart(4, '0').toUpperCase();
  }

  private generateFinalQRCodeContent(hoaDon: HoaDon, bank: Bank): string {
    const qrContent = this.generateEMVCoQRContent(hoaDon, bank);
    const crc = this.calculateCRC(qrContent);
    return qrContent + crc;
  }
}