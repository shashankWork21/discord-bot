const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const cron = require("node-cron");
const fs = require("fs");

const app = express();
const port = 5001;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ],
});

client.once("ready", () => {
  const sendStatusMessage = () => {
    const guild = client.guilds.cache.get("789365405063577600");
    const channel = guild.channels.cache.get("820906455716200478");
    const unavailableMemberIds = [
      "750112234474176593",
      "889391323386359849",
      "803887520483770368",
      "808932563094601738",
    ];
    console.log(new Date());
    const statuses = {
      online: [],
      idle: [],
      dnd: [],
      offline: [],
    };
    guild.members.fetch({ withPresences: true }).then((members) => {
      members
        .filter(
          (member) =>
            !member.user.bot && !unavailableMemberIds.includes(member.user.id)
        )
        .forEach((member) => {
          if (member.presence) {
            statuses[member.presence.status].push(member.user.globalName);
          } else {
            statuses.offline.push(member.user.globalName);
          }
        });

      const statusMessage = `
       ${
         statuses.idle.length
           ? `\n**Idle**: ${statuses.idle.length} - ${statuses.idle.join(", ")}`
           : ""
       }${
        statuses.dnd.length
          ? `\n**Do not Disturb**: ${statuses.dnd.length} - ${statuses.dnd.join(
              ", "
            )}`
          : ""
      }${
        statuses.offline.length
          ? `\n**Offline**: ${
              statuses.offline.length
            } - ${statuses.offline.join(", ")}`
          : ""
      }
      `;
      console.log(statusMessage);
      channel.send(statusMessage);
    });
  };
  cron.schedule(
    "15 10,13,16 * * Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
    sendStatusMessage
  );
  cron.schedule(
    "45 11,14,17 * * Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
    sendStatusMessage
  );

  // cron.schedule("30 13 * * Saturday", () => {
  //   const guild = client.guilds.cache.get("789365405063577600");
  //   const channel = guild.channels.cache.get("820906455716200478");
  //   channel.send(
  //     "<@1008971073154449418>, All the best! You have my best wishes! :)"
  //   );
  // });
});

client.login(
  "MTI1NDc2MzI3MzE1NzQ3NjQ2Mw.GuG2JT.ux7Km38gMux96V0RrMjoLUqk32TDtThi7Jh7Fw"
);

app.get("/", async (req, res) => {
  const guild = client.guilds.cache.get("789365405063577600");
  const channel = guild.channels.cache.get("820906455716200478");
  let messages = await channel.messages.fetch({ limit: 100 });
  const attendanceMessages = Array.from(
    messages.filter((message) => message.author.id === "1254763273157476463"),
    ([key, value]) => value
  );
  do {
    const keys = messages.map((message) => parseInt(message.id));
    const lastKey = `${Math.min(...keys)}`;
    messages = await channel.messages.fetch({ limit: 100, before: lastKey });
    attendanceMessages.push(
      ...Array.from(
        messages.filter(
          (message) => message.author.id === "1254763273157476463"
        ),
        ([key, value]) => value
      )
    );
  } while (
    messages.filter((message) => message.author.id === "1254763273157476463")
      .size > 0
  );

  const attendanceCount = {};

  for (const message of attendanceMessages.map((message) => message.content)) {
    const statuses = message.split("\n");
    const idleMessage = statuses.find((status) => status.includes("Idle"));
    const dndMessage = statuses.find((status) =>
      status.includes("Do not Disturb")
    );
    const offlineMessage = statuses.find((status) =>
      status.includes("Offline")
    );
    if (idleMessage) {
      const firstSplit = idleMessage.split(":");
      const [, peopleList] = firstSplit[1].split(" - ");
      const people = peopleList.split(", ");
      for (const person of people) {
        if (!attendanceCount[person]) {
          attendanceCount[person] = {
            idleCount: 1,
          };
        } else {
          if (!attendanceCount[person].idleCount) {
            attendanceCount[person].idleCount = 1;
          } else {
            attendanceCount[person].idleCount =
              attendanceCount[person].idleCount + 1;
          }
        }
      }
    }
    if (dndMessage) {
      const firstSplit = dndMessage.split(":");
      const [, peopleList] = firstSplit[1].split(" - ");
      const people = peopleList.split(", ");
      for (const person of people) {
        if (!attendanceCount[person]) {
          attendanceCount[person] = {
            dndCount: 1,
          };
        } else {
          if (!attendanceCount[person].dndCount) {
            attendanceCount[person].dndCount = 1;
          } else {
            attendanceCount[person].dndCount =
              attendanceCount[person].dndCount + 1;
          }
        }
      }
    }
    if (offlineMessage) {
      const firstSplit = offlineMessage.split(":");
      const [, peopleList] = firstSplit[1].split(" - ");
      const people = peopleList.split(", ");
      for (const person of people) {
        if (!attendanceCount[person]) {
          attendanceCount[person] = {
            dndCount: 1,
          };
        } else {
          if (!attendanceCount[person].offlineCount) {
            attendanceCount[person].offlineCount = 1;
          } else {
            attendanceCount[person].offlineCount =
              attendanceCount[person].offlineCount + 1;
          }
        }
      }
    }
  }
  fs.writeFileSync("attendance.json", JSON.stringify(attendanceCount));
  res.json({
    attendanceCount,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
