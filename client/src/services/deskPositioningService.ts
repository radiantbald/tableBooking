import { Desk } from '../api/desks';
import { BASE_OFFICE_WIDTH, BASE_OFFICE_HEIGHT } from '../types/deskTypes';
import { DeskSizeService } from './deskSizeService';
import { getDeskNumber } from '../utils/deskUtils';

export interface Position {
  x: number;
  y: number;
}

/**
 * Сервис для позиционирования столов
 * Принцип Single Responsibility: отвечает только за вычисление позиций столов
 */
export class DeskPositioningService {
  /**
   * Вычисляет позиции всех столов
   */
  static calculatePositions(desks: Desk[], scale: number): Record<string, Position> {
    const positions: Record<string, Position> = {};
    const officeWidth = BASE_OFFICE_WIDTH * scale;
    const officeHeight = BASE_OFFICE_HEIGHT * scale;
    const rightBorderOfficeMap = officeWidth - 2;
    const leftBorderOfficeMap = 2;

    // Создаем карту столов по номерам
    const desksByNumber: Record<number, Desk> = {};
    desks.forEach(desk => {
      const deskNumber = getDeskNumber(desk);
      desksByNumber[deskNumber] = desk;
    });

    // Позиционируем столы 1-12
    this.positionDesks1to12(desksByNumber, positions, rightBorderOfficeMap, scale, officeHeight);

    // Позиционируем столы 17-18
    this.positionDesks17to18(desksByNumber, positions, leftBorderOfficeMap, officeHeight, scale);

    // Позиционируем столы 13-16
    this.positionDesks13to16(desksByNumber, positions, leftBorderOfficeMap, rightBorderOfficeMap, officeHeight, scale);

    // Позиционируем стол 19
    this.positionDesk19(desksByNumber, positions, rightBorderOfficeMap, officeHeight, scale);

    // Для остальных столов используем стандартное позиционирование
    desks.forEach(desk => {
      const deskNumber = getDeskNumber(desk);
      if (!positions[desk.id] && (deskNumber < 1 || deskNumber > 19)) {
        positions[desk.id] = {
          x: desk.x * scale,
          y: desk.y * scale,
        };
      }
    });

    return positions;
  }

  /**
   * Позиционирует столы 1-12 (три ряда по 4 стола)
   */
  private static positionDesks1to12(
    desksByNumber: Record<number, Desk>,
    positions: Record<string, Position>,
    rightBorderOfficeMap: number,
    scale: number,
    officeHeight: number
  ): void {
    const rows = [
      [4, 3, 2, 1],
      [8, 7, 6, 5],
      [12, 11, 10, 9],
    ];

    // Первый ряд (1-4)
    const firstRow = rows[0];
    firstRow.forEach((deskNumber, index) => {
      const desk = desksByNumber[deskNumber];
      if (!desk) return;

      const deskSize = DeskSizeService.getDeskSizeByNumber(deskNumber, scale);
      const x = index === 0
        ? rightBorderOfficeMap - deskSize.width
        : positions[desksByNumber[firstRow[index - 1]].id].x - deskSize.width;

      positions[desk.id] = {
        x,
        y: desk.y * scale,
      };
    });

    // Вычисляем нижнюю границу группы 1-4
    const desk4 = desksByNumber[4];
    let group1to4Bottom = 0;
    if (desk4 && positions[desk4.id]) {
      const desk4Size = DeskSizeService.getDeskSizeByNumber(4, scale);
      group1to4Bottom = positions[desk4.id].y + desk4Size.height;
    }

    const dividerLineY = officeHeight / 2;
    const centerY = (group1to4Bottom + dividerLineY) / 2;

    // Вычисляем высоту группы 5-12
    const desk5Size = DeskSizeService.getDeskSizeByNumber(5, scale);
    const desk9Size = DeskSizeService.getDeskSizeByNumber(9, scale);
    const group5to12Height = desk5Size.height + desk9Size.height;
    const group5to12StartY = centerY - group5to12Height / 2;

    // Второй ряд (5-8)
    const secondRow = rows[1];
    secondRow.forEach((deskNumber, index) => {
      const desk = desksByNumber[deskNumber];
      if (!desk) return;

      const deskSize = DeskSizeService.getDeskSizeByNumber(deskNumber, scale);
      const x = index === 0
        ? rightBorderOfficeMap - deskSize.width
        : positions[desksByNumber[secondRow[index - 1]].id].x - deskSize.width;

      positions[desk.id] = {
        x,
        y: group5to12StartY,
      };
    });

    // Третий ряд (9-12)
    const thirdRow = rows[2];
    const secondRowBottom = group5to12StartY + desk5Size.height;
    thirdRow.forEach((deskNumber, index) => {
      const desk = desksByNumber[deskNumber];
      if (!desk) return;

      const deskSize = DeskSizeService.getDeskSizeByNumber(deskNumber, scale);
      const x = index === 0
        ? rightBorderOfficeMap - deskSize.width
        : positions[desksByNumber[thirdRow[index - 1]].id].x - deskSize.width;

      positions[desk.id] = {
        x,
        y: secondRowBottom,
      };
    });
  }

  /**
   * Позиционирует столы 17-18
   */
  private static positionDesks17to18(
    desksByNumber: Record<number, Desk>,
    positions: Record<string, Position>,
    leftBorderOfficeMap: number,
    officeHeight: number,
    scale: number
  ): void {
    const desk17 = desksByNumber[17];
    const desk18 = desksByNumber[18];

    if (desk17) {
      const desk17Size = DeskSizeService.getDeskSizeByNumber(17, scale);
      const desk17Left = leftBorderOfficeMap;

      const lowerSectionStart = officeHeight / 2;
      const lowerSectionEnd = officeHeight;
      const lowerSectionCenter = (lowerSectionStart + lowerSectionEnd) / 2;

      if (desk18) {
        const desk18Size = DeskSizeService.getDeskSizeByNumber(18, scale);
        const totalHeight = desk17Size.height + desk18Size.height;
        const desk17Top = lowerSectionCenter - totalHeight / 2 + 50;

        positions[desk17.id] = {
          x: desk17Left,
          y: desk17Top,
        };

        const desk17Bottom = desk17Top + desk17Size.height;
        positions[desk18.id] = {
          x: desk17Left,
          y: desk17Bottom,
        };
      } else {
        const desk17Top = desk17.y * scale + 50;
        positions[desk17.id] = {
          x: desk17Left,
          y: desk17Top,
        };
      }
    }
  }

  /**
   * Позиционирует столы 13-16 (сетка 2x2)
   */
  private static positionDesks13to16(
    desksByNumber: Record<number, Desk>,
    positions: Record<string, Position>,
    leftBorderOfficeMap: number,
    rightBorderOfficeMap: number,
    officeHeight: number,
    scale: number
  ): void {
    const desk13 = desksByNumber[13];
    const desk14 = desksByNumber[14];
    const desk15 = desksByNumber[15];
    const desk16 = desksByNumber[16];

    if (!desk13) return;

    const desk13Size = DeskSizeService.getDeskSizeByNumber(13, scale);
    const desk14Size = desk14 ? DeskSizeService.getDeskSizeByNumber(14, scale) : { width: 0, height: 0 };

    // Вычисляем правый border группы 17-18
    let group17to18RightBorder = leftBorderOfficeMap;
    const desk17 = desksByNumber[17];
    if (desk17) {
      const desk17Size = DeskSizeService.getDeskSizeByNumber(17, scale);
      group17to18RightBorder = leftBorderOfficeMap + desk17Size.width;
    }

    const centerX = (group17to18RightBorder + rightBorderOfficeMap) / 2;
    const group13to16Width = desk13Size.width + desk14Size.width;
    const desk13Left = centerX - group13to16Width / 2;
    const dividerLineY = officeHeight / 2;

    // Стол 13
    positions[desk13.id] = {
      x: desk13Left,
      y: dividerLineY,
    };

    // Стол 14
    if (desk14) {
      const desk13Right = desk13Left + desk13Size.width;
      positions[desk14.id] = {
        x: desk13Right,
        y: dividerLineY,
      };
    }

    // Стол 15
    if (desk15) {
      const desk13Bottom = dividerLineY + desk13Size.height;
      positions[desk15.id] = {
        x: desk13Left,
        y: desk13Bottom,
      };

      // Стол 16
      if (desk16 && desk14) {
        const desk14Bottom = dividerLineY + desk14Size.height;
        const desk15Size = DeskSizeService.getDeskSizeByNumber(15, scale);
        const desk15Right = desk13Left + desk15Size.width;
        positions[desk16.id] = {
          x: desk15Right,
          y: desk14Bottom,
        };
      }
    }
  }

  /**
   * Позиционирует стол 19
   */
  private static positionDesk19(
    desksByNumber: Record<number, Desk>,
    positions: Record<string, Position>,
    rightBorderOfficeMap: number,
    officeHeight: number,
    scale: number
  ): void {
    const desk19 = desksByNumber[19];
    if (!desk19) return;

    const desk19Size = DeskSizeService.getDeskSizeByNumber(19, scale);
    const bottomBorderOfficeMap = officeHeight - 2;
    const desk19Left = rightBorderOfficeMap - desk19Size.width;

    // Вычисляем нижний border группы 15-16
    let group15to16Bottom = 0;
    const desk15 = desksByNumber[15];
    const desk16 = desksByNumber[16];

    if (desk15 && positions[desk15.id]) {
      const desk15Size = DeskSizeService.getDeskSizeByNumber(15, scale);
      const desk15Bottom = positions[desk15.id].y + desk15Size.height;
      group15to16Bottom = desk15Bottom;

      if (desk16 && positions[desk16.id]) {
        const desk16Size = DeskSizeService.getDeskSizeByNumber(16, scale);
        const desk16Bottom = positions[desk16.id].y + desk16Size.height;
        group15to16Bottom = Math.max(desk15Bottom, desk16Bottom);
      }
    }

    const centerY = (group15to16Bottom + bottomBorderOfficeMap) / 2;
    const desk19Top = centerY - desk19Size.height / 2;

    positions[desk19.id] = {
      x: desk19Left,
      y: desk19Top,
    };
  }
}

