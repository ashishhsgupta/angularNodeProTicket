import { getDB } from '../config/database.js'
import moment from 'moment'

export const registration = async (req, res) => {
  const { phone_no, email, role, password } = req.body

  if (!phone_no || !email || !role || !password) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    })
  }

  try {
    const DB = await getDB()

    console.log('Received phone no:', phone_no)
    const [existngUser] = await DB.execute(
      `SELECT user_id FROM user_details WHERE phone_no = ?`,
      [phone_no]
    )
    console.log('Existing user check result:', existngUser)

    if (existngUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered!'
      })
    }

    const [insertResult] = await DB.execute(
      `INSERT INTO user_details(phone_no, email, role, password) VALUES(?,?,?,?)`,
      [phone_no, email, role, password]
    )
    console.log('insert result:', insertResult)
    res.status(201).json({
      success: true,
      message: 'registration successful',
      insertId: insertResult.insertId
    })
  } catch (err) {
    console.error('Error while registration', err.message)
    res.status(500).json({ success: false, message: 'Failed for registration' })
  }
}

export const login = async (req, res) => {
  const { phone_no, password } = req.body

  if (!phone_no || !password) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    })
  }

  try {
    const DB = await getDB()

    console.log('phone no:', phone_no)
    const [existngUser] = await DB.execute(
      `SELECT * from user_details WHERE phone_no = ?`,
      [phone_no]
    )

    if (existngUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Please login with a valid phone no.'
      })
    }

    const user = existngUser[0]
    if (user.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials.' })
    }

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      userId: user.user_id,
      phone_no: user.phone_no,
      email: user.email,
      role: user.role
    })
  } catch (err) {
    console.error('Error while login:', err.message)
    res.status(500).json({ success: false, message: 'Failed for login' })
  }
}

export const generateTicket = async (req, res) => {
  console.log('API hit')
  const {
    name,
    email,
    department,
    type,
    subject,
    description,
    user_id: bodyUserId,
    userPhone
  } = req.body

  console.log('API request:', req.body)

  if (!name || !email || !department || !type || !subject || !description) {
    console.log('Missing req fields')

    return res
      .status(401)
      .json({ success: false, message: 'Missing required fields' })
  }

  const DB = getDB()
  const created_at = new Date()
  const todayPrefix = moment().format('DDMMYY')

  let user_id = req.user?.id || bodyUserId

  if (!user_id && userPhone) {
    const [userRows] = await DB.execute(
      `SELECT user_id from user_details WHERE phone_no = ?`,
      [userPhone]
    )
    if (userRows.length > 0) {
      user_id = userRows[0].user_id
    } else {
      return res
        .status(404)
        .json({ success: false, message: 'Missing user ID' })
    }
  }

  try {
    const sqlGetMax = `SELECT ticket_id FROM ticket_details WHERE ticket_id LIKE ? ORDER BY ticket_id DESC LIMIT 1`
    const [rows] = await DB.execute(sqlGetMax, [`${todayPrefix}%`])

    console.log('step 1: checking for existing ticket ID:', rows.length)

    let newTicketId

    if (rows.length > 0) {
      const lastId = rows[0].ticket_id
      console.log('Step 2: last ticket ID:', lastId)

      const lastNumber = parseInt(lastId.substring(6), 10)
      const newNumber = lastNumber + 1

      newTicketId = `${todayPrefix}${String(newNumber).padStart(5, '0')}`
      console.log('Step 3: new ticket ID:', newTicketId)
    } else {
      newTicketId = `${todayPrefix}00001`
      console.log('Step 4: first ticket of the day:', newTicketId)
    }
    console.log('Step 5: insering ticket into DB')
    // 2. Insert new ticket
    const sqlInsert = `
        INSERT INTO ticket_details (
        user_id, ticket_id, name, email, department, type, subject, description, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    await DB.execute(sqlInsert, [
      user_id,
      newTicketId,
      name,
      email,
      department,
      type,
      subject,
      description,
      'pending',
      created_at
    ])
    console.log('Step 6: ticket inserted successfully')

    return res.status(201).json({
      success: true,
      message: 'Ticket generated successfully',
      ticket_id: newTicketId,
      status: 'pending'
    })
  } catch (err) {
    console.error('Error while generating ticket:', err.message)
    return res
      .status(500)
      .json({ success: false, message: 'Failed to generate ticket' })
  }
}

export const fetchTicketRecords = async (req, res) => {
  try {
    const DB = await getDB();
    const {status} = req.query;
    let query = `SELECT * FROM ticket_details`;
    let params = [];
    if(status){
      query += `WHERE status = ?`;
      params.push(status);
    }
    const [rows] = await DB.execute(query, params);

    res
      .status(200)
      .json({
        success: true,
        message: 'Ticket records fetched successfully',
        data: rows
      })
  } catch (err) {
    console.error('Getting error while fetch ticket:', message.err)
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to fetch tickets',
        err: err.message
      })
  }
}
