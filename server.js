const PORT = 8000;
const Sequelize = require('sequelize')
const Op = Sequelize.Op;

const dotenv = require('dotenv')
dotenv.config();

const cors = require('cors');
const express = require('express')

const { db, Participants, Interviews } = require('./models/db')



const nodemailer = require('nodemailer');

var smtpTransport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS
    }
});

const app = express()

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => res.send("hi i am host"));




app.get('/participants', (req, res) => {
    Participants.findAll()
        .then((users) => res.json(users))

});


async function getData(obj) {
    var results = await Interviews.findAll({
        where: {
            date: obj.date,
            startTime: obj.startTime,
            endTime: obj.endTime,
        },
        attributes: ['participantId'],
    })
   
    let pArray = results.map((res) => res.dataValues.participantId);
  
    return results;
}

app.get('/interviews', function (req, res) {

    let cDate = new Date();
    Interviews.findAll({
        where: {
            date: {
                [Op.gte]: cDate,
            }
        },
  
        order: [['date', 'ASC'], ['startTime', 'ASC'], ['endTime', 'ASC'], ['participantId', 'ASC']],
        
    })
        .then((records) => {
           
           
   
            res.json(records);
        })

})

app.get('/distinctschedules', function (req, res) {
    let cDate = new Date();
    Interviews.findAll({
        where: {
            date: {
                [Op.gte]: cDate,
            }
        },
        
        order: [['date', 'ASC'], ['startTime', 'ASC'], ['endTime', 'ASC'], ['participantId', 'ASC']],
        group: ['date', 'startTime', 'endTime']
    })
        .then((records) => {
            
            let distinctSchedules = records.map((rec) => ({
                date: rec.date,
                startTime: rec.startTime,
                endTime: rec.endTime,
            }))
           
            res.json(distinctSchedules);
        })
})

app.post('/interviews', function (req, res) {
   

    let date_INC = req.body.date;
    let startTime_INC = req.body.startTime;
    let endTime_INC = req.body.endTime;
    let lisOfparticipants = req.body.participants;
    

    if (lisOfparticipants.length < 2) {
        console.error("gen error");
        res.status(401).send({ message: 'Add atleast 2 particpants please!' });
    } else {
      
        let participantIdArray = lisOfparticipants.map((p) => p.id);
       

        Interviews.findOne({
            where: {
                date: date_INC,
                [Op.or]: [{
                    [Op.and]: [{
                        endTime: {
                            [Op.gte]: endTime_INC
                        }
                    }, {
                        startTime: {
                            [Op.lte]: startTime_INC
                        }
                    }
                    ]
                }, {
                    [Op.and]: [{
                        endTime: {
                            [Op.gte]: endTime_INC
                        }
                    }, {
                        startTime: {
                            [Op.gte]: startTime_INC
                        }
                    }, {
                        startTime: {
                            [Op.lt]: endTime_INC
                        }
                    }
                    ]
                }, {
                    [Op.and]: [{
                        endTime: {
                            [Op.lte]: endTime_INC
                        }
                    }, {
                        startTime: {
                            [Op.lte]: startTime_INC
                        }
                    }, {
                        endTime: {
                            [Op.gt]: startTime_INC
                        }
                    }
                    ]
                }, {
                    [Op.and]: [{
                        startTime: {
                            [Op.gte]: startTime_INC
                        }
                    }, {
                        endTime: {
                            [Op.lte]: endTime_INC
                        }
                    }
                    ]
                }],
                participantId: {
                    [Op.in]: participantIdArray
                }
            }
        })
            .then(function (record) {
                if (record) {
                    
                    let clashingParticipantId = record.dataValues.participantId;
                   

                    let msg = "Following Partipant have Clashing Interviews : ";
                    Participants.findByPk(clashingParticipantId)
                        .then((record) => {
                        
                            msg = msg + record.dataValues.name + "(" + record.dataValues.email + ")";
                          
                            res.status(401).send({ message: msg });
                        })

                }
                else {
                   
                   lisOfparticipants.forEach(function (oneParticipant) {
                       
                        let newInterview = {
                            participantId: oneParticipant.id,
                            date: date_INC,
                            startTime: startTime_INC,
                            endTime: endTime_INC
                        }
                        Interviews.create(newInterview).then(intrvw => {
                           
                            let participantEmail = oneParticipant.email;
                          

                            let mailText = `Date : ${date_INC}, from ${startTime_INC} to ${endTime_INC}`;
                            var mailOptions = {
                                to: participantEmail,
                                subject: 'Interview Details.',
                                text: mailText
                            }
                            smtpTransport.sendMail(mailOptions, function (err, res) {
                                if (err) {
                                }
                                else {
                                   
                                }
                            })

                        })
                    })
                    res.sendStatus(200);
                }
            })

    }
   

})


db.sync().then(() => {
    app.listen(PORT, () => {
      
    })
})
