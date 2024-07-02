import { Restaurant, Product, RestaurantCategory, ProductCategory } from '../models/models.js'

const index = async function (req, res) {
  try {
    const restaurants = await Restaurant.findAll(
      {
        attributes: { exclude: ['userId'] },
        include:
      {
        model: RestaurantCategory,
        as: 'restaurantCategory'
      },
        order: [[{ model: RestaurantCategory, as: 'restaurantCategory' }, 'name', 'ASC']]
      }
    )
    res.json(restaurants)
  } catch (err) {
    res.status(500).send(err)
  }
}

const indexOwner = async function (req, res) {
  try {
    const restaurants = await Restaurant.findAll(
      {
        attributes: { exclude: ['userId'] },
        where: { userId: req.user.id },
        include: [{
          model: RestaurantCategory,
          as: 'restaurantCategory'
        }]
      })
    res.json(restaurants)
  } catch (err) {
    res.status(500).send(err)
  }
}

const create = async function (req, res) {
  const newRestaurant = Restaurant.build(req.body)
  newRestaurant.userId = req.user.id // usuario actualmente autenticado
  try {
    const restaurant = await newRestaurant.save()
    res.json(restaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

/*
Se desea ofrecer a los propietarios que los productos de sus restaurantes aparezcan ordenados según el campo order de la
entidad Producto o según el campo price del producto, y que puedan determinar cual será el orden predeterminado en cada
restaurante, de manera que cuando se listen los productos aparezcan siempre según el orden que haya decidido.

Recuerde que actualmente los productos se muestran en la pantalla de detalle del restaurante y el backend los devuelve
siempre ordenados según el campo order. Por defecto, cada restaurante ordenará sus productos según el mencionado campo order.
*/
// SOLUCION
const show = async function (req, res) {
  // Only returns PUBLIC information of restaurants
  try {
    let restaurant = await Restaurant.findByPk(req.params.restaurantId)
    const orderingBy = restaurant.orderByPrice
      ? [[{ model: Product, as: 'products' }, 'price', 'ASC']]
      : [[{ model: Product, as: 'products' }, 'order', 'ASC']]

    restaurant = await Restaurant.findByPk(req.params.restaurantId, {
      attributes: { exclude: ['userId'] },
      include: [{
        model: Product,
        as: 'products',
        include: { model: ProductCategory, as: 'productCategory' }
      },
      {
        model: RestaurantCategory,
        as: 'restaurantCategory'
      }],
      order: orderingBy
    }
    )
    res.json(restaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const update = async function (req, res) {
  try {
    await Restaurant.update(req.body, { where: { id: req.params.restaurantId } })
    const updatedRestaurant = await Restaurant.findByPk(req.params.restaurantId)
    res.json(updatedRestaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const destroy = async function (req, res) {
  try {
    const result = await Restaurant.destroy({ where: { id: req.params.restaurantId } })
    let message = ''
    if (result === 1) {
      message = 'Sucessfuly deleted restaurant id.' + req.params.restaurantId
    } else {
      message = 'Could not delete restaurant.'
    }
    res.json(message)
  } catch (err) {
    res.status(500).send(err)
  }
}

// SOLUCION
/*
const orderingBy = async function (req, res) {
  const t = await sequelizeSession.transaction()
  try {
    const restaurantChange = Restaurant.findByPk(req.params.restaurantId)
    if (restaurantChange.orderByPrice) {
      await restaurantChange.update({ orderByPrice: false }, { transaction: t })
    } else {
      await restaurantChange.update({ orderByPrice: true }, { transaction: t })
    }
    await t.commit()
    const orderRestaurant = await restaurantChange.save()
    res.json(orderRestaurant)
  } catch (err) {
    await t.rollback()
    res.status(500).send(err)
  }
} */

// SOLUCION
const orderingBy = async function (req, res) {
  try {
    const restaurant = await Restaurant.findByPk(req.params.restaurantId)
    if (!restaurant.orderByPrice) {
      restaurant.orderByPrice = true
    } else {
      restaurant.orderByPrice = false
    }
    const orderRestaurant = await restaurant.save()
    res.json(orderRestaurant)
  } catch (err) {
    res.status(500).send(err)
  }
}

const RestaurantController = {
  index,
  indexOwner,
  create,
  show,
  update,
  destroy,
  orderingBy
}
export default RestaurantController
