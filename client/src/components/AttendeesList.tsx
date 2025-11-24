import React, { useMemo } from 'react';
import { Desk } from '../api/desks';

interface AttendeesListProps {
  desks: Desk[];
  currentUserEmail: string;
  selectedDate: string;
  onAttendeeHover?: (email: string | null) => void;
}

/**
 * Компонент списка участников
 * Принцип Single Responsibility: отвечает только за отображение списка участников
 */
const AttendeesList: React.FC<AttendeesListProps> = ({ desks, currentUserEmail, selectedDate, onAttendeeHover }) => {
  const bookedUsers = useMemo(() => {
    const usersMap = new Map<string, { email: string; deskLabel: string }>();
    desks.forEach(desk => {
      let userEmail: string | null = null;

      if (desk.status === 'booked' && desk.bookedBy) {
        userEmail = desk.bookedBy;
      } else if (desk.status === 'my') {
        userEmail = desk.bookedBy || currentUserEmail;
      }

      if (userEmail && !usersMap.has(userEmail)) {
        usersMap.set(userEmail, { email: userEmail, deskLabel: desk.label });
      }
    });
    return Array.from(usersMap.values())
      .filter(user => user.email !== currentUserEmail)
      .sort((a, b) => a.email.localeCompare(b.email));
  }, [desks, currentUserEmail]);

  const hasCurrentUserBooking = useMemo(() => {
    return desks.some(desk =>
      desk.status === 'my' ||
      (desk.status === 'booked' && desk.bookedBy === currentUserEmail)
    );
  }, [desks, currentUserEmail]);

  const handleAttendeeClick = (email: string) => {
    const username = email.split('@')[0];
    const bandLink = `https://band.wb.ru/wb/messages/@${username}`;
    window.open(bandLink, '_blank');
  };

  return (
    <div className="office-attendees-list">
      <h3 className="attendees-title">В этот день ты сможешь ❤️❤️❤️ поработать рядом с ребятами</h3>
      {bookedUsers.length > 0 ? (
        <ul className="attendees-list" key={selectedDate}>
          {bookedUsers.map((user, index) => (
            <li 
              key={`${user.email}-${selectedDate}-${index}`}
              className="attendee-item"
              style={{
                animationDelay: `${index * 0.1}s`
              }}
              onMouseEnter={() => onAttendeeHover?.(user.email)}
              onMouseLeave={() => onAttendeeHover?.(null)}
            >
              <div className="attendee-info">
                <div className="attendee-email">{user.email}</div>
                <div className="attendee-desk">{user.deskLabel}</div>
              </div>
              <img
                src="/images/band-logo.png"
                alt="Написать в band"
                className="band-logo"
                onClick={() => handleAttendeeClick(user.email)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-attendees">
          {hasCurrentUserBooking
            ? "Никто кроме тебя еще не забронировал место на эту дату🥲"
            : "Никто еще не забронировал место на эту дату"
          }
        </div>
      )}
    </div>
  );
};

export default AttendeesList;

