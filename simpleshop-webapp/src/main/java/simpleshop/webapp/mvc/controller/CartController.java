package simpleshop.webapp.mvc.controller;

import org.springframework.validation.Validator;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.*;
import simpleshop.dto.CartItem;
import simpleshop.dto.JsonResponse;
import simpleshop.dto.ShoppingCart;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;
import javax.validation.Valid;

/**
 * Entry point for shopping cart related logic.
 */
@RestController
@RequestMapping("/cart")
public class CartController {

    @Resource(name = "businessValidator")
    private Validator businessValidator;

    public static final String SHOPPING_CART_SESSION_KEY = "shoppingCart";

    @InitBinder("cartItem")
    public void initBinder(WebDataBinder binder) {
        binder.addValidators(businessValidator);
    }

    @RequestMapping(value = "/add", method = RequestMethod.POST)
    public JsonResponse<String> addToCart(HttpSession session, @Valid @RequestBody final CartItem cartItem) {

        ShoppingCart cart = (ShoppingCart) session.getAttribute(SHOPPING_CART_SESSION_KEY);
        if (cart == null) {
            cart = new ShoppingCart();
            session.setAttribute(SHOPPING_CART_SESSION_KEY, cart);
        }
        synchronized (cart) {
            boolean added = false;
            for (CartItem item : cart.getItems()) {
                if (item.getProductId().equals(cartItem.getProductId())) {
                    item.setQuantity(item.getQuantity() + cartItem.getQuantity());
                    added = true;
                    break;
                }
            }
            if (!added)
                cart.getItems().add(cartItem);

        }
        return JsonResponse.createSuccess("OK");
    }

    @RequestMapping(value = "/remove", method = RequestMethod.POST)
    public JsonResponse<String> removeFromCart(HttpSession session, @Valid @RequestBody final CartItem cartItem) {

        ShoppingCart cart = (ShoppingCart) session.getAttribute(SHOPPING_CART_SESSION_KEY);
        if (cart != null) {
            synchronized (cart) {
                CartItem affectedItem = null;
                for (CartItem item : cart.getItems()) {
                    if (item.getProductId().equals(cartItem.getProductId())) {
                        item.setQuantity(item.getQuantity() - cartItem.getQuantity());
                        affectedItem = item;
                        break;
                    }
                }
                if(affectedItem != null && affectedItem.getQuantity() <= 0){
                    cart.getItems().remove(affectedItem);
                }
            }
        }
        return JsonResponse.createSuccess("OK");
    }

    @RequestMapping(value = "/get", method = RequestMethod.GET)
    public JsonResponse<ShoppingCart> getCart(HttpSession session) {
        ShoppingCart cart = (ShoppingCart) session.getAttribute(SHOPPING_CART_SESSION_KEY);
        if (cart == null) {
            cart = new ShoppingCart();
            session.setAttribute(SHOPPING_CART_SESSION_KEY, cart);
        }
        return JsonResponse.createSuccess(cart);
    }


}
