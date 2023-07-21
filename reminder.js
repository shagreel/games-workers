const games = await fetch("https://games.chill.ws/games.json")
    .then((response) => response.json());

const makeListString = (arr) => {
    if (arr.length === 1) return arr[0];
    const firsts = arr.slice(0, arr.length - 1);
    const last = arr[arr.length - 1];
    return firsts.join(', ') + ' and ' + last;
};

export const sendEmail = async (borrowed) => {
    const email = borrowed[0].email;
    const name = borrowed[0].name;
    const games = makeListString(borrowed.map(b => b.game));
    const response = fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            personalizations: [
                {
                    to: [{ email: email, name: name }],
                },
            ],
            from: {
                email: 'plum@games.chill.ws',
                name: 'Lehi Board Game Club',
            },
            subject: `Kindly return ${games}`,
            content: [
                {
                    type: 'text/plain',
                    value: `I would like to make an accusation. The evidence points to the fact that ${name} borrowed ${games} from the game library but has not returned ${borrowed.length > 1 ? 'them' : 'it'} promptly. The policy for borrowing a game from the Adobe Lehi Board Game Club is that you will return it within a week.\n\nThanks,\nProfessor Plum`,
                },
            ],
        }),
    });
};

export const emailLateBorrowers = async (borrowed) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const late = borrowed.filter(b => new Date(b.borrowed.date) < sevenDaysAgo )
        .reduce((r, a) => {
            r[a.borrowed.email] = r[a.borrowed.email] || [];
            const game = games.find(g => g.id == a.id);
            const data = {
                game: game.name,
                name: a.borrowed.name,
                email: a.borrowed.email,
                date: a.borrowed.date
            }
            r[a.borrowed.email].push(data);
            return r;
        }, {});
    for (var key in late) {
        sendEmail(late[key]);
    }
}

